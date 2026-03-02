import { Parser,Language }  from '../lib/TreeSitter/web-tree-sitter.js';
await Parser.init().then(() => {
    console.log("Parser init")
});

window.TreeSitter=(function(){
    var Code='';
    var types={

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

    var d3config={estreeops:types,fontsize:14}
    function setD3Config(conf){
        d3config=conf
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
        var result=child2Body(tree.rootNode)
        function child2Body(node){
            var n=getNodeValue(node)
            if(node.childCount>0){
                n['body']=[]
            }
            for (const child of node.children) {
                let c=child2Body(child);
                n['body'].push(c)
            }
            return n 
        }
        console.log("TreeSitter getAst",filename,filetype,result,tree.rootNode)
        return result;
    }

    function traverseAst(node,callback){
        callback&&callback(node)
        if(node.body&&node.body.length>0){
            for(let n of node.body){
                traverseAst(n,callback)
            }
        }
    }



    function getNodeValue(node){
        var n={}
        n._type=node.type
        n.text=node.text;
        n.poi={
            start:node.startPosition.column,
            line:node.startPosition.row
        }

        if(node.type==="namespace_declaration"||node.type==="internal_module"){//cs ts
            n.value=getChildByType(node)?.text
            n.type="Namespace"
        }
        else if(node.type==="interface_declaration"){//cs ts
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(node,'type_identifier').text//ts
            n.type="InterfaceDefine"
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
            n.type="ClassDefine"
        }
        else if(node.type==="class_definition"){//py
            n.value=getChildByType(node)?.text
            n.extends=getChildrenTextByType(getChildByType(node,'argument_list',true))
            n.type="ClassDefine"
        }
        else if(node.type==="field_declaration"){//cs member
            let vd=getChildByType(node,'variable_declaration')
            n.predefined_type=getChildByType(vd,"predefined_type")?.text
            if(!n.predefined_type)n.predefined_type=getChildByType(vd,"generic_name")?.text
            n.value=getChildByType(vd,"variable_declarator")?.text
            n.level=getChildByType(node,'modifier',true)?.text
            n.type="PropertyDefine"
        }
        else if(node.type==="public_field_definition"||node.type==="property_signature"||node.type==="field_definition"){//ts js
            n.predefined_type=getChildByType(getChildByType(node,"type_annotation"),"predefined_type")?.text
            n.value=getChildByType(node,"property_identifier")?.text
            n.level=getChildByType(node,'accessibility_modifier',true)?.text
            if(!n.level)n.level='public'
            n.type="PropertyDefine"
        }
        else if(node.type==="constructor_declaration"){//cs
            n.value=getChildByType(node)?.text
            n.level=getChildByType(node,'modifier',true)?.text
            let parameter_list=getChildByType(node,'parameter_list')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'parameter')
            n.type="MethodDefine"
        }
        else if(node.type==="method_declaration"){//cs
            n.value=getChildByType(node)?.text
            let return_type=getChildByType(node,'identifier',true)?.text
            n.return_type=n.value==return_type?"void":return_type;
            n.level=getChildByType(node,'modifier',true)?.text
            let parameter_list=getChildByType(node,'parameter_list')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'parameter')
            n.type="MethodDefine"
        }
        else if(node.type==="method_signature"||node.type==="method_definition"||node.type==="abstract_method_signature"){//ts
            n.value=getChildByType(node)?.text//ts
            if(!n.value)n.value=getChildByType(node,"property_identifier")?.text//ts
            n.return_type=getChildByType(getChildByType(node,"type_annotation"),"predefined_type")?.text
            n.level=getChildByType(node,'accessibility_modifier',true)?.text
            let parameter_list=getChildByType(node,'formal_parameters')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list,'required_parameter')
            if(n.parameters.length==0){//js
                n.parameters=getChildrenTextByType(parameter_list)
            }
            n.type="MethodDefine"
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
            n.type="FunctionDefine"
        }
        else if(node.type==="object_creation_expression"){//cs new
            n.value=getChildByType(node)?.text
            let argument_list=getChildByType(node,'argument_list')
            n.arg=argument_list?.text
            n.arguments=getChildrenTextByType(argument_list,'argument')
        }       
        else if(node.type==="invocation_expression"){//cs call
            n.value=getChildByType(node)?.text
            if(!n.value){
                n.value=getChildByType(getChildByType(node,"member_access_expression")).text
            }
            let argument_list=getChildByType(node,'argument_list')
            n.arg=argument_list?.text
            n.arguments=getChildrenTextByType(argument_list,'argument')
            n.type="CallExpression"
        }
        else if(node.type==="for_statement"||node.type==="while_statement"||node.type==="do_statement"||node.type==="foreach_statement"){
            n.condition=getChildByType(node,"binary_expression")?.text;
            if(!n.condition)n.condition=getChildByType(node,"comparison_operator")?.text;
            if(!n.condition)n.condition=getChildByType(node)?.text//cs foreach py for
            n.type="LoopStatement"
        }
        else if(node.type==="for_in_statement"){//ts
            n.condition=getChildByType(node)?.text;
            n.type="LoopStatement"
        }
        else if(node.type==="if_statement"||node.type==="else_clause"){
            n.condition=getChildByType(node,"binary_expression")?.text;
            if(!n.condition)n.condition=getChildByType(node,"comparison_operator")?.text;
            if(!n.condition)n.condition=getChildByType(node,"parenthesized_expression")?.text;//ts
            n.type="IfStatement"
        }
        else if(node.type==="function_definition"){//py
            n.value=getChildByType(node)?.text
            let parameter_list=getChildByType(node,'parameters')
            n.param=parameter_list?.text
            n.parameters=getChildrenTextByType(parameter_list)
            n.type="FunctionDefine"
        }
        else if(node.type==="call"){//py
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(getChildByType(node,"attribute"))?.text
            n.arg=getChildByType(node,'argument_list')?.text
            n.type="CallExpression"
        }
        else if(node.type==="call_expression"){//ts
            n.value=getChildByType(node)?.text
            if(!n.value)n.value=getChildByType(getChildByType(node,"member_expression"),"property_identifier")?.text
            n.arg=getChildByType(node,'arguments')?.text
            n.type="CallExpression"
        }
        else if(node.type==="list_comprehension"){//py for
            n.value=node.text
            n.type="LoopStatement"
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
                n.type="FunctionDefine"
            }
        }
        else if(node.type==="new_expression"){//ts
            n.value=getChildByType(node)?.text
            let argument_list=getChildByType(node,'arguments')
            n.arg=argument_list?.text
            n.type="NewExpression"
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

    function analysisMermaid(){

    }

    function analysisD3(){

    }

    function loc2poi(){

    }


    return {
        getAst:getAst,
        traverseAst:traverseAst,
        analysisMermaid:analysisMermaid,
        analysisD3:analysisD3,
        setD3Config:setD3Config,
        types:types,
        loc2poi:loc2poi,
        setCode:setCode
    }
})()