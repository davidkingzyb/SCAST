var SCASTTS=(function(){
    var types={
        ClassDefine:true,
        InterfaceDefine:true,
        NamespaceDefine:true,
        MethodDefine:true,
        PropertyDefine:true,
        Variable:true,
        NewExpression:true,
        CallExpression:true,
        FunctionDefine:true,
        LoopStatement:true,
        IfStatement:true,
    }

    function getAst(code){
        const sourceFile = ts.createSourceFile(
            'tsfile',
            code,
            ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
        );

        function traverseTs(sourceFile) {
            var ast = { type: 'top', body: [] }
            delintNode(sourceFile);
            return ast
            function delintNode(node) {
                switch (node.kind) {
                    // case ts.SyntaxKind.ForStatement:
                    // case ts.SyntaxKind.ForInStatement:
                    // case ts.SyntaxKind.WhileStatement:
                    // case ts.SyntaxKind.DoStatement:
                    // case ts.SyntaxKind.IfStatement:
                    // case ts.SyntaxKind.BinaryExpression:
                    // case ts.SyntaxKind.NewExpression:
                    // case ts.SyntaxKind.PropertyAccessExpression:
                    // case ts.SyntaxKind.PropertyDeclaration:
                    // case ts.SyntaxKind.CallExpression:
                    // case ts.SyntaxKind.FunctionDeclaration:
                    case ts.SyntaxKind.ClassDeclaration:
                        ast.body.push(traverseClass(node))
                        break;
                    default:
                    // console.log('traverseAst kind:',ts.SyntaxKind[node.kind]) 
                }

                ts.forEachChild(node, delintNode);
            }

            function traverseClass(node) {
                console.log('traverseClass',node)
                var cls = { type: 'ClassDefine', value: node.name.escapedText, body: [], extends: [],poi:sourceFile.getLineAndCharacterOfPosition(node.getStart()) }
                for (let extend of node.heritageClauses||[]) {
                    console.log('extend', extend.types[0].expression)
                    cls.extends.push(extend.types[0].expression.escapedText || extend.types[0].expression.expression.escapedText)
                }
                for (let member of node.members) {
                    let _poi = sourceFile.getLineAndCharacterOfPosition(member.getStart())
                    let n = { poi: { line: _poi.line, start: _poi.character } }
                    switch (member.kind) {
                        case ts.SyntaxKind.PropertyDeclaration:
                            n.type = "PropertyDefine"
                            n.value = member.name.escapedText
                            cls.body.push(n)
                            break;
                        case ts.SyntaxKind.MethodDeclaration:
                            n.type = "MethodDefine";
                            n.value = member.name.escapedText
                            n.body = traverseMethod(member)
                            cls.body.push(n)
                            break;
                        case ts.SyntaxKind.Constructor:
                            n.type = "ConstructorDefine";
                            n.value = node.name.escapedText
                            n.body = traverseMethod(member)
                            cls.body.push(n)
                            break;
                        case ts.SyntaxKind.FunctionDeclaration:
                            n.type = "FunctionDefine";
                            n.value = member.name.escapedText
                            n.body = traverseMethod(member)
                            cls.body.push(n)
                            break;
                        default:
                        // console.log('traverseClass kind:',ts.SyntaxKind[member.kind]) 
                    }
                }
                return cls
            }

            function traverseMethod(node) {//todo method detail
                // console.log("traverseMethod",node)
                return []
            }

        }
        console.log(sourceFile)
        return traverseTs(sourceFile)
    }
    function traverseAst(node,callback){
        callback && callback(node)
        if (node.body && node.body.length > 0) {
            for (let n of node.body) {
                traverseAst(n, callback)
            }
        }
    }

    function analysisMermaid(node,file,r){
        switch(node.type){
            case 'ClassDefine':
                if(!r.showMethod)break
                if(r.FlowFilter[node.value]===false)break;
                r.Flow+=`    ${node.value}[${node.value}]\nclick ${node.value} "javascript:void(onFlowClick('${node.value}','${file}'))"\n`
                r.FDPNode[node.value]={id:node.value,w:node.value.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${node.value}]`}
                traverseClass(node,file)
                break;
            case 'InterfaceDefine':
                if(!r.showMethod)break
                if(r.FlowFilter[node.value]===false)break;
                r.Flow+=`    ${node.value}{{${node.value}}}\nclick ${node.value} "javascript:void(onFlowClick('${node.value}','${file}'))"\n`
                r.FDPNode[node.value]={id:node.value,w:node.value.length*gD3fontSize/1.6+gD3fontSize*2,text:`{${node.value}}`}
                traverseClass(node,file)
                break;
            case 'NamespaceDefine':
                if(!r.showMethod)break
                if(!r.showNamespace)break;
                if(namespace){
                    r.Flow+=`  end\n  subgraph ${node.value}.namespace\n`
                }else{
                    r.Flow+=`  subgraph ${node.value}.namespace\n`
                    namespace=node.value;
                }
                break;
            case "FunctionDefine":
                if(r.showMethod)break
                // console.log('function define',node)
                traverseMethod(node,{},file)
                break
            case "MethodDefine":
                if(r.showMethod)break
                // console.log("method",node)
                traverseMethod(node,{},file)
                break
            case "Variable":
                if(r.showMethod)break
                traverseVariable(node,{},file)
                break
        }
    
        function traverseClass(node,file){
            node._file=file
            r.FlowNode[node.value]=node;
            r.FlowOne[node.value]=node.value
            r.UMLClass[node.value]={}
            var level_symbol={
                'public':'+',
                "private":'-',
                "protected":'#',
                "internal":'~',
                "static":'$',
            }
            r.UML+=`  class ${node.value}{\n`;
            // if(node.type=="InterfaceDefine"){
                // r.UML+=`     <<interface>> ${node.value}\n`;//mermaid bug
            // }
            for(let member of node.body){
                let symbol=member.level&&level_symbol[member.level]?level_symbol[member.level]:' ';
                switch(member.type){
                    case "PropertyDefine":
                        traverseProperty(member,node,file,symbol)
                        break;
                    case "MethodDefine":
                        traverseMethod(member,node,file,symbol)
                        break;
                    case "FunctionDefine":
                        traverseMethod(member,node,file,symbol)
                        break;
                }
            }
            r.UML+='  }\n'
            if(node.extends){
                for(let f of node.extends){
                    if(r.FlowNode[f]&&r.FlowNode[f].type=="InterfaceDefine"){
                        r.FDPNode[f]={id:f,w:f.length*gD3fontSize/1.6+gD3fontSize*2,text:`{${f}}`}
                        r.UML+=`  ${f} <|.. ${node.value}\n`
                        r.FlowLink+=`${f} ==> ${node.value}\n` 
                        r.FDPLinks.push({source:node.value,target:f,value:6,dist:200,dash:'2,2'})
                    }else{
                        if(r.FDPNode[f]===undefined)r.FDPNode[f]={id:f,w:f.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${f}]`}
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
            member._flow_prop=`|${symbol}${member.value.replaceAll('|','\|').replaceAll('[','').replaceAll(']','')}|`
            member._file=file
            if(r.FlowFilter[member._flow_id]===false)return;
            r.FlowNode[member._flow_id]=member;
            r.UML+=`    ${symbol}${member.value}\n`
            // console.log('prop',member)
            if(r.showCall)_doBody(member,file)
            function _doBody(node,file){
                if(!node.body)return
                for(let n of node.body ){
                    n._file=file
                    n._flow_id=n.value+'_'+node._flow_id
                    n._flow_from=node._flow_from
                    n._flow_prop=node._flow_prop
                    r.FlowNode[n._flow_id]=n
                    if(n.type=="Expression"){
                        // console.log('var',n)
                        n._flow_id=node._flow_id;
                        _doBody(n,file)
                    }else if(r.FlowFilter[n._flow_id]&&(n.type=="NewExpression"||n.type=="CallExpression")){
                        if(n.type=="NewExpression"){
                            r.UMLClass[cls.value][n._flow_id]=n;
                            n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6,text:`${n.value}`}
                        }else{
                            n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6+gD3fontSize*2,text:`${n.value}()`}
                        }
                        r.Flow+=n._flow_str;    
                    }
                }
            }
        }
    
        function traverseMethod(member,cls,file,symbol){
            var method=cls.value?member.value+'_'+cls.value:member.value
            r.FlowOne[member.value]=method//todo 处理不同类同名方法
            member._flow_id=method
            member._flow_from=cls.value
            member._file=file
            if(r.FlowFilter[member._flow_id]===false)return;
            r.FlowNode[member._flow_id]=member;
            r.FDPNode[member._flow_id]={id:member._flow_id,w:member.value.length*gD3fontSize/1.6+gD3fontSize*3,text:`${symbol||':'}${member.value}()`}
            if(symbol)r.UML+=`    ${symbol}${member.value}()\n`
            if(member.base||member.value==cls.value){//constructor
                r.Flow+=`    ${member._flow_id}(${member.value})\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
            }else{
                r.Flow+=`    ${member._flow_id}([${member.value}])\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
            }
            if(cls.value){
                r.FlowLink+=`${cls.value} --o ${member._flow_id}\n`
                r.FDPLinks.push({source:cls.value,target:member._flow_id,value:2})
            }
            if(r.showCall)_doBody(member,file)    
            function _doBody(node,file){
                if(!node.body)return
                for(let n of node.body ){
                    n._file=file
                    n._flow_id=n.value+'_'+node._flow_id
                    n._flow_from=r.showIf?node._flow_id:method
                    r.FlowNode[n._flow_id]=n
                    if(n.type=="IfStatement"||n.type=="LoopStatement"){//can't show condition CallExpression
                        if(r.showIf){
                            r.Flow+=n.type=="IfStatement"?`        ${n._flow_id}{${n.value}}\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`:`        ${n._flow_id}((${n.value}))\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:0,text:n.type=="IfStatement"?'🔷':'🔵'}
                        }  
                        if(n.condition&&n.condition.value)n._flow_condition='|'+n.condition.value.replaceAll('|','｜').replaceAll('[','⌈').replaceAll(']','⌋')+'|'
                        _doBody(n,file)
                    }else if(r.FlowFilter[n._flow_id]&&(n.type=="NewExpression"||n.type=="CallExpression")){
                        if(n.type=="NewExpression"){
                            if(cls.value)r.UMLClass[cls.value][n._flow_id]=n;
                            n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6,text:n.value}
                        }else{
                            n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6+gD3fontSize*2,text:n.value+'()'}
                        }
                        r.Flow+=n._flow_str;    
                    }else if(n.type=="Expression"){
                        n._flow_id=node._flow_id;
                        _doBody(n,file)
                    }else if(n.type=='Variable'){
                        n._flow_id=node._flow_id;//not a flow node same as condition
                        if(!r.showMethod)traverseVariable(n,file)
                        else{_doBody(n,file)}
                    }
                }
            }
        }
    
        function traverseVariable(variable,file){
            if(r.showMethod)return
            // console.log('traverse var',variable)
            _doBody(variable,file)
            function _doBody(node,file){
                if(!node.body)return
                for(let n of node.body){
                    n._file=file
                    n._flow_id=n.value+'_'+node._flow_id
                    n._flow_from=node._flow_id
                    if(r.FlowNode[n._flow_id])continue
                    r.FlowNode[n._flow_id]=n
                    if(r.FlowFilter[n._flow_id]&&(n.type=="NewExpression"||n.type=="CallExpression")){
                        if(n.type=="NewExpression"){
                            n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6,text:n.value}
                        }else{
                            n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                            r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6+gD3fontSize*2,text:n.value+'()'}
                        }
                        r.Flow+=n._flow_str;    
                    }else if(n.type=="Expression"){
                        n._flow_id=node._flow_id
                        _doBody(n,file)
                    }
                }
            }
        }
    }
    
    function analysisD3(node,file){
        node.children=[]
        if(node.body&&node.body.length>0){
            for(let b of node.body){
                if(d3config.scastops[b.type]||d3config.scastops.all){
                    node.children.push(b)
                }
            }
        }
        switch(node.type){
            case 'top':
                node.name=file
                node.value=file
                break;
            case 'ClassDefine':
                node.name=`[ ${node.value} ]`
                break;
            case 'InterfaceDefine':
                node.name=`( ${node.value} )`
                break;
            case 'MethodDefine':
                if(node.level&&level_symbol[node.level]){
                    node.name=`${level_symbol[node.level]}${node.value}()`
                }else{
                    node.name=`:${node.value}()`
                }
                break;
            case 'FunctionDefine':
                node.name=`:${node.value}()`
                break;
            case 'PropertyDefine':
                if(node.level&&level_symbol[node.level]){
                    node.name=`${level_symbol[node.level]}${node.value}`
                }else{
                    node.name=`${node.value}`
                }
                break;
            case 'NamespaceDefine':
                node.name=node.value+'.namespace'
                break;
            case 'NewExpression':
                node.name='( '+node.value+' )'
                break;
            case 'CallExpression':
                node.name=node.value+'()'
                break;
            default:
                node.name=node.value
        }
    }
    var d3config={}
    function setD3Config(conf){
        d3config=conf
    }

    return {
        getAst:getAst,
        traverseAst:traverseAst,
        analysisMermaid:analysisMermaid,
        analysisD3:analysisD3,
        types:types,
        setD3Config:setD3Config
    }

})()

SCAST=SCASTTS