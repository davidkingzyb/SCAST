

window.TreeSitter=(function(){
    var Code='';
    var types={
        "Namespace":true,
        "Class":true,
        "Interface":true,
        "Method":true,
        "Property":true,
        "Variable":true,
        "New":true,
        "Call":true,
        "Function":true,
        "Loop":true,
        "If":true
    }
    const LANGUAGE_WASM={
        'js':'../lib/TreeSitter/tree-sitter-javascript.wasm',
        'ts':'../lib/TreeSitter/tree-sitter-typescript.wasm',
        'py':'../lib/TreeSitter/tree-sitter-python.wasm',
        'sh':'../lib/TreeSitter/tree-sitter-bash.wasm',
        'cs':'../lib/TreeSitter/tree-sitter-c_sharp.wasm',
        'cpp':'../lib/TreeSitter/tree-sitter-cpp.wasm',
        'c':'../lib/TreeSitter/tree-sitter-c.wasm',
        'hlsl':'../lib/TreeSitter/tree-sitter-c.wasm',
        'shader':'../lib/TreeSitter/tree-sitter-c.wasm',
    }

    var language_parser={
        'js':null,
        'ts':null,
        'py':null,
        'sh':null,
        'cs':null,
        'cpp':null,
        'c':null,
        'hlsl':null,
        'shader':null,
    }

    var d3config={treesitterops:types,fontsize:14}
    function setD3Config(conf){
        d3config=conf
        console.log('Tree Sitter d3config',d3config)
    }
    function setCode(code){
        Code = code;
    }

    async function getAst(code,filename,filetype){
        var parser=language_parser[filetype]
        if(parser===null){
            parser=new Parser();
            const language=await Language.load(LANGUAGE_WASM[filetype])
            console.log('[TreeSitter] load ',LANGUAGE_WASM[filetype])
            parser.setLanguage(language);
            language_parser[filetype]=parser
        }
        Code=code;
        const tree=parser.parse(code)
        var result=genValue(tree.rootNode)
        function genValue(node){
            var n=getNodeValue(node)
            if(node.childCount>0){
                n['children']=[]
            }
            for (const child of node.children) {
                let c=genValue(child);
                n['children'].push(c)
            }
            return n 
        }
        result=getTopTree(filterTree(result))
        console.log("TreeSitter getAst",filename,filetype,result)
        return result;
    }

    function traverseAst(node,callback){
        callback&&callback(node)
        if(node.children&&node.children.length>0){
            for(let n of node.children){
                traverseAst(n,callback)
            }
        }
    }

    function getTopTree(tree){
        var result={type:"top"}
        if (Array.isArray(tree)) {
            result['children']=tree
        }else{
            result['children']=[tree]
        }
        return result;
    }

    function filterTree(node) {
        if (!node) return null;
        
        if (types[node.type]&&d3config.treesitterops[node.type]) {
            const new_node = {
                children: []
            };
            for(let k in node){
                if(k!='children')new_node[k]=node[k]
            }
            if (node.children && node.children.length > 0) {
                for (const child of node.children) {
                    const result = filterTree(child);
                    if (result) {
                        if (Array.isArray(result)) {
                            new_node.children.push(...result);
                        } else {
                            new_node.children.push(result);
                        }
                    }
                }
            }
            return new_node;
        } else {
            const nodes = [];
            if (node.children && node.children.length > 0) {
                for (const child of node.children) {
                    const result = filterTree(child);
                    if (result) {
                        if (Array.isArray(result)) {
                            nodes.push(...result);
                        } else {
                            nodes.push(result);
                        }
                    }
                }
            }
            if (nodes.length === 0) {
                return null;
            } else if (nodes.length === 1) {
                return nodes[0];
            } else {
                return nodes;
            }
        }
    }

    function getNodeValue(node){
        var n={}
        n._type=node.type
        n.text=node.text;
        n.poi={
            start:node.startPosition.column,
            line:node.startPosition.row+1
        }
        n.node=node;//dev

        if(node.type==="namespace_declaration"||node.type==="internal_module"){//cs ts
            n.value=getChildByType(node)?.text
            n.type="Namespace"
        }
        else if(node.type==="interface_declaration"){//cs ts
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(node,'type_identifier').text//ts
            n.type="Interface"
        }
        else if(node.type==="class_declaration"||node.type==="abstract_class_declaration"){//cs ts js
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(node,'type_identifier').text//ts
            n.level=getChildByType(node,'modifier',true)?.text
            n.extends=getChildrenTextByType(getChildByType(node,'base_list',true))
            if(n.extends.length==0){//ts js
                let ch=getChildByType(node,'class_heritage')
                let ec=getChildByType(ch,'extends_clause')
                n.extends=getChildrenTextByType(ec)
                if(!ec){//ts
                    ec=getChildByType(ch,'implements_clause')
                    n.extends=getChildrenTextByType(ec,'type_identifier')
                }
                if(!ec){//js
                    n.extends=getChildrenTextByType(ch)
                }
            }
            n.type="Class"
        }
        else if(node.type==="class_definition"){//py
            n.value=getChildByType(node)?.text
            n.extends=getChildrenTextByType(getChildByType(node,'argument_list',true))
            n.type="Class"
        }
        else if(node.type==="field_declaration"){//cs member
            let vd=getChildByType(node,'variable_declaration')
            n.predefined_type=getChildByType(vd,"predefined_type")?.text
            if(!n.predefined_type)n.predefined_type=getChildByType(vd,"generic_name")?.text
            n.value=getChildByType(getChildByType(vd,"variable_declarator"))?.text
            n.level=getChildByType(node,'modifier',true)?.text
            n.type="Property"
        }
        else if(node.type==="public_field_definition"||node.type==="property_signature"||node.type==="field_definition"){//ts js
            n.predefined_type=getChildByType(getChildByType(node,"type_annotation"),"predefined_type")?.text
            n.value=getChildByType(node,"property_identifier")?.text
            n.level=getChildByType(node,'accessibility_modifier',true)?.text
            if(!n.level)n.level='public'
            n.type="Property"
        }
        else if(node.type==="constructor_declaration"){//cs
            n.value=getChildByType(node)?.text
            n.level=getChildByType(node,'modifier',true)?.text
            let parameter_list=getChildByType(node,'parameter_list')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'parameter')
            n.type="Method"
        }
        else if(node.type==="method_declaration"){//cs
            n.value=getChildByType(node)?.text
            let return_type=getChildByType(node,'identifier',true)?.text
            n.return_type=n.value==return_type?"void":return_type;
            n.level=getChildByType(node,'modifier',true)?.text
            let parameter_list=getChildByType(node,'parameter_list')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'parameter')
            n.type="Method"
        }
        else if(node.type==="method_signature"||node.type==="method_definition"||node.type==="abstract_method_signature"){//ts
            n.value=getChildByType(node)?.text//ts
            if(!n.value)n.value=getChildByType(node,"property_identifier")?.text//ts
            if(n.value=="constructor"){
                n.value="_constructor"
            }
            n.return_type=getChildByType(getChildByType(node,"type_annotation"),"predefined_type")?.text
            n.level=getChildByType(node,'accessibility_modifier',true)?.text
            let parameter_list=getChildByType(node,'formal_parameters')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'required_parameter')
            if(n.parameters.length==0){//js
                n.parameters=getChildrenTextByType(parameter_list)
            }
            n.type="Method"
        }
        else if(node.type==="function_declaration"){//js ts
            n.value=getChildByType(node)?.text
            n.return_type=getChildByType(getChildByType(node,"type_annotation"),"predefined_type")?.text//ts
            let parameter_list=getChildByType(node,'formal_parameters')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'required_parameter')
            if(n.parameters.length==0){//js
                n.parameters=getChildrenTextByType(parameter_list)
            }
            n.type="Function"
        }
        else if(node.type==="object_creation_expression"){//cs new
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(node,"generic_name")?.text;
            let argument_list=getChildByType(node,'argument_list')
            n.arg=argument_list?.text
            n.arguments=getChildrenTextByType(argument_list,'argument')
            n.type="New"
        }       
        else if(node.type==="invocation_expression"){//cs call
            n.value=getChildByType(node)?.text
            if(!n.value){
                n.value=getChildByType(getChildByType(node,"member_access_expression"))?.text
            }
            let argument_list=getChildByType(node,'argument_list')
            n.arg=argument_list?.text
            n.arguments=getChildrenTextByType(argument_list,'argument')
            n.type="Call"
        }
        else if(node.type==="for_statement"||node.type==="while_statement"||node.type==="do_statement"||node.type==="foreach_statement"
            ||node.type==="for_in_statement"||node.type==="list_comprehension"){
            n.value="loop"
            n.condition=getChildByType(node,"binary_expression")?.text;
            if(!n.condition)n.condition=getChildByType(node,"comparison_operator")?.text;
            if(!n.condition)n.condition=getChildByType(node)?.text//cs foreach py for in
            if(!n.condition)n.condition=node.text//py for
            n.type="Loop"
        }

        else if(node.type==="if_statement"||node.type==="else_clause"){
            n.value="if"
            n.condition=getChildByType(node,"binary_expression")?.text;
            if(!n.condition)n.condition=getChildByType(node,"comparison_operator")?.text;
            if(!n.condition)n.condition=getChildByType(node,"parenthesized_expression")?.text;//ts
            n.type="If"
        }
        else if(node.type==="function_definition"){//py
            n.value=getChildByType(node)?.text
            let parameter_list=getChildByType(node,'parameters')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list)
            n.type="Function"
        }
        else if(node.type==="call"){//py
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(getChildByType(node,"attribute"))?.text
            n.arg=getChildByType(node,'argument_list')?.text
            n.type="Call"
        }
        else if(node.type==="call_expression"){//ts
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(getChildByType(node,"member_expression"),"property_identifier")?.text
            n.arg=getChildByType(node,'arguments')?.text
            n.type="Call"
        }
        else if(node.type==="variable_declarator"||node.type==="assignment"){//ts py js
            n.value=getChildByType(node)?.text
            let funcNode=getChildByType(node,"function_expression")
            if(!funcNode)funcNode=getChildByType(node,"arrow_function")
            if(funcNode){
                funcNode.value=n.value
            }
            n.type="Variable"
        }
        else if(node.type==="pair"){//js obj
            let funcNode=getChildByType(node,"function_expression")
            if(!funcNode)funcNode=getChildByType(node,"arrow_function")
            if(funcNode){
                funcNode.value=getChildByType(node,"property_identifier")?.text
            }
        }
        else if(node.type==="function_expression"||node.type==="arrow_function"){//js
            if(node.value){
                n.value=node.value;
                n.arg=getChildByType(node,"formal_parameters")?.text
                n.type="Function"
            }
        }
        else if(node.type==="new_expression"){//ts
            n.value=getChildByType(node)?.text
            let argument_list=getChildByType(node,'arguments')
            n.arg=argument_list?.text
            n.type="New"
        }
        return n;

        function getChildByType(node,type='identifier',isfirst=false){
            if(node===null)return null
            var result=null
            for(let child of node.children){
                if(child.type==type){
                    result=child
                    if(isfirst)return result
                }
            }
            return result
        }

        function getChildrenTextByType(node,type='identifier'){
            if(node==null)return []
            var result=[]
            for(let child of node.children){
                if(child.type==type){
                    result.push(child.text)
                }
                if(type==='*'){
                    result.push(child.text)
                }
            }
            return result
        }
    }

    

    const LEVEL={
        "public":'+',
        "private":'-',
        "protected":"#",
        "static":'$',
        "abstract":'*'
    }

    function analysisMermaid(node,file,r){
        switch(node.type){
            case 'Namespace':
                if(!r.showNamespace)break;
                if(r.namespace){
                    r.Flow+=`  end\n  subgraph ${node.value}.namespace\n`
                }else{
                    r.Flow+=`  subgraph ${node.value}.namespace\n`
                    r.namespace=node.value;
                }
                break;
            case 'Interface':
                if(r.FlowFilter[node.value]===false)break;
                r.Flow+=`    ${node.value}{{${node.value}}}\nclick ${node.value} "javascript:void(onFlowClick('${node.value}','${file}'))"\n`
                r.FDPNode[node.value]={id:node.value,w:node.value.length*d3config.fontsize/1.6+d3config.fontsize*2,text:`{${node.value}}`}
                traverseClass(node,file)
                break;
            case 'Class':
                if(r.FlowFilter[node.value]===false)break;
                r.Flow+=`    ${node.value}[${node.value}]\nclick ${node.value} "javascript:void(onFlowClick('${node.value}','${file}'))"\n`
                r.FDPNode[node.value]={id:node.value,w:node.value.length*d3config.fontsize/1.6+d3config.fontsize*2,text:`[${node.value}]`}
                traverseClass(node,file)
                break;
            case "Function":
                if(r.showMethod)break
                console.log('function define',node)
                traverseMethod(node,{},file)
                break
            // case "Method":
            //     if(r.showMethod)break
            //     // console.log("method",node)
            //     traverseMethod(node,{},file)
            //     break

        }


        function traverseClass(node,file){
            node._file=file
            r.FlowNode[node.value]=node;
            if(r.FlowOne[node.value]){
                if(r.FlowOne[node.value].indexOf(node.value)<0){
                    r.FlowOne[node.value].unshift(node.value)
                }
            }else{
                r.FlowOne[node.value]=[node.value]
            }
            r.UMLClass[node.value]={}
            r.UML+=`  class ${node.value}{\n`;
            // if(node.type=="Interface"){
            //     r.UML+=`     <<interface>> ${node.value}\n`;//mermaid bug
            // }
            for(let member of node.children){
                let symbol=member.level&&LEVEL[member.level]?LEVEL[member.level]:' ';
                switch(member.type){
                    case "Property":
                        traverseProperty(member,node,file,symbol)
                        break;
                    case "Method":
                        traverseMethod(member,node,file,symbol)
                        break;
                    case "Function"://py
                        traverseMethod(member,node,file,symbol)
                        break;
                }
            }
            r.UML+='  }\n'
            if(node.extends){
                for(let f of node.extends){
                    if(r.FlowNode[f]&&r.FlowNode[f].type=="Interface"){
                        r.FDPNode[f]={id:f,w:f.length*d3config.fontsize/1.6+d3config.fontsize*2,text:`{${f}}`}
                        r.UML+=`  ${f} <|.. ${node.value}\n`
                        r.FlowLink+=`${f} ==> ${node.value}\n` 
                        r.FDPLinks.push({source:node.value,target:f,value:6,dist:200,dash:'2,2'})
                    }else{
                        if(r.FDPNode[f]===undefined)r.FDPNode[f]={id:f,w:f.length*d3config.fontsize/1.6+d3config.fontsize*2,text:`[${f}]`}
                        r.UML+=`  ${f} <|-- ${node.value}\n`
                        r.FlowLink+=`${f} ==o ${node.value}\n` 
                        r.FDPLinks.push({source:f,target:node.value,value:6,dist:200,dash:"2,2"})
                    }
                }
            }
        }

        function traverseProperty(member,cls,file,symbol){
            member._flow_id=member.value+'_'+cls.value
            member._flow_from=cls.value
            member._flow_prop=`|${symbol}${mermaidRepl(member.value)}|`
            member._file=file
            if(r.FlowFilter[member._flow_id]===false)return;
            r.FlowNode[member._flow_id]=member;
            r.UML+=`    ${symbol}${member.value}\n`
            if(r.showCall)_doBody(member,file)
            function _doBody(node,file){
                if(!node.children)return
                // console.log('prop',node)
                
                for(let n of node.children ){
                    if(n.type==="Variable"){//cs property->var->new/call
                        _doBody(n,file)
                    }
                    n._file=file
                    n._flow_id=n.value+'_'+node._flow_id
                    n._flow_from=node._flow_from
                    n._flow_prop=node._flow_prop
                    r.FlowNode[n._flow_id]=n
                    if(r.FlowFilter[n._flow_id]){
                
                        if(n.type=="New"){
                            r.UMLClass[cls.value][n._flow_id]=n;
                            n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*d3config.fontsize/1.6,text:`${n.value}`}
                            r.FlowVarNew[node.value]=n.value
                            r.Flow+=n._flow_str;    
                        }else if(n.type=="Call"){
                            n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*d3config.fontsize/1.6+d3config.fontsize*2,text:`${n.value}()`}
                            r.Flow+=n._flow_str;    
                        }
                    }
                }
            }
        }

        function traverseMethod(member,cls,file,symbol){
            var method=cls.value?member.value+'_'+cls.value:member.value
            if(r.FlowOne[member.value]){
                if(r.FlowOne[member.value].indexOf(method)<0){
                    r.FlowOne[member.value].unshift(method)
                }
            }else{
                r.FlowOne[member.value]=[method]
            }
            member._flow_id=method
            member._flow_from=cls.value
            member._file=file
            if(r.FlowFilter[member._flow_id]===false)return;
            r.FlowNode[member._flow_id]=member;
            r.FDPNode[member._flow_id]={id:member._flow_id,w:member.value.length*d3config.fontsize/1.6+d3config.fontsize*3,text:`${symbol||':'}${member.value}()`}
            if(symbol)r.UML+=`    ${symbol}${member.value}()\n`
            if(member.value==cls.value||member.value==="_constructor"){//constructor
                r.Flow+=`    ${member._flow_id}(${cls.value})\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
            }else{
                r.Flow+=`    ${member._flow_id}([${member.value}])\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
            }
            if(cls.value){
                r.FlowLink+=`${cls.value} --o ${member._flow_id}\n`
                r.FDPLinks.push({source:cls.value,target:member._flow_id,value:2})
            }
            if(r.showCall)_doBody(member,file)    
            function _doBody(node,file){
                if(!node.children)return
                for(let n of node.children ){
                    n._file=file
                    n._flow_id=n.value+'_'+node._flow_id
                    n._flow_from=r.showIf?node._flow_id:method
                    if(n.type=="If"||n.type=="Loop"){//can't show condition CallExpression
                        if(r.showIf){
                            r.Flow+=n.type=="If"?`        ${n._flow_id}{${n.value}}\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`:`        ${n._flow_id}((${n.value}))\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:0,text:n.type=="If"?'🔷':'🔵'}
                        }  
                        if(n.condition)n._flow_condition='|'+mermaidRepl(n.condition)+'|'
                        _doBody(n,file)
                    }else if(r.FlowFilter[n._flow_id]&&(n.type=="New"||n.type=="Call")){
                        if(n.type=="New"){
                            r.FlowVarNew[node.value]=n.value
                            if(cls.value)r.UMLClass[cls.value][n._flow_id]=n;
                            n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*d3config.fontsize/1.6,text:n.value}
                        }else{
                            if(n.callee?.value==node.value){
                                if(r.showMethod){n._flow_callee=n.value+'_'+cls.value}
                                else{n._flow_callee=n.value}
                            }else{
                                n._flow_callee=n.callee?.value;
                            }
                            // console.log('callee',n._flow_callee,cls,n,node)
                            if(r.FlowNode[n._flow_id])n._flow_id=n._flow_callee+'_'+n._flow_id;
                            n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*d3config.fontsize/1.6+d3config.fontsize*2,text:n.value+'()'}
                        }
                        r.Flow+=n._flow_str;    
                    }
                    if(n.type=='Variable'){
                        n._flow_id=node._flow_id;//not a flow node same as condition
                        if(!r.showMethod)traverseVariable(n,file)
                        else{_doBody(n,file)}
                    }
                    r.FlowNode[n._flow_id]=n
                }
            }
        }

        function traverseVariable(variable,file){
            if(r.showMethod)return
            // console.log('traverse var',variable)
            _doBody(variable,file)
            function _doBody(node,file){
                if(!node.children)return
                for(let n of node.children){
                    n._file=file
                    n._flow_id=n.value+'_'+node._flow_id
                    n._flow_from=node._flow_id
                    if(r.FlowNode[n._flow_id])continue
                    r.FlowNode[n._flow_id]=n
                    if(r.FlowFilter[n._flow_id]&&(n.type=="New"||n.type=="Call")){
                        if(n.type=="New"){
                            r.FlowVarNew[node.value]=n.value
                            n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*d3config.fontsize/1.6,text:n.value}
                        }else{
                            n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*d3config.fontsize/1.6+d3config.fontsize*2,text:n.value+'()'}
                        }
                        r.Flow+=n._flow_str;    
                    }
                }
            }
        }

    }

    function analysisD3(node){
        switch(node.type){
            case "top":
                node.name=node.filename
                break;
            case "Interface":
                node.name=`{ ${node.value} }`
                break;
            case 'Class':
                node.name=`[ ${node.value} ]`
                break;
            case 'Method':
                let level=LEVEL[node.level]||''
                node.name=`${level}${node.value}${node.param||''}`
                break;
            case 'Function':
                node.name=`${node.value}${node.param||''}`
                break;
            case 'New':
                node.name=`new ${node.value}`
                break;
            case 'Call':
                node.name=node.value+'()'
                break;
            case 'If':
                node.name=`if ${node.condition}`
                break;
            case "Loop":
                node.name=`for ${node.condition}`
                break;
            default:
                node.name=node.value
        }
    }

    function mermaidRepl(s){
        return s.replaceAll('|','‼').replaceAll('[','⌈').replaceAll(']','⌋').replaceAll('(','⟪').replaceAll(')','⟫').replaceAll('{','⟪').replaceAll('}','⟫')
    }

    return {
        getAst:getAst,
        traverseAst:traverseAst,
        analysisMermaid:analysisMermaid,
        analysisD3:analysisD3,
        setD3Config:setD3Config,
        types:types,
        setCode:setCode,
        getTopTree:getTopTree,
        filterTree:filterTree,
    }
})()

import { Parser,Language }  from '../lib/TreeSitter/web-tree-sitter.js';
await Parser.init().then(() => {
    console.log("Parser init")
    
});