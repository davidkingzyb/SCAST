var ESTREEJS=(function(){

    const option={
        ecmaVersion: 2022,
        locations:true,
        ranges:true,
        sourceType:'module',
    }
    var Code='';

    var types={
        "Program":true,
        "BlockStatement":true,
        "ExpressionStatement":true,

        "Identifier":true,
        "Literal":false,
        "TemplateElement":false,
        "RegExpLiteral":false,

        "FunctionDeclaration":true,
        "FunctionExpression":true,
        "ArrowFunctionExpression":true,
        "CallExpression":true,
        "ReturnStatement":false,
        "YieldExpression":false,

        "NewExpression":true,
        "VariableDeclaration":true,
        "VariableDeclarator":true,
        "MemberExpression":true,
        "ChainExpression":false,
        "ArrayExpression":true,
        "ObjectExpression":true,
        "SequenceExpression":false,
        "ArrayPattern":true,
        "ObjectPattern":true,

        "IfStatement":true,
        "SwitchStatement":true,
        "SwitchCase":true,
        "ConditionalExpression":true,

        "ThrowStatement":false,
        "TryStatement":true,
        "CatchClause":true,

        "WhileStatement":true,
        "DoWhileStatement":true,
        "ForStatement":true,
        "ForInStatement":true,
        "ForOfStatement":true,
        "ContinueStatement":false,
        "BreakStatement":false,

        "ClassDeclaration":true,
        "ClassBody":true,
        "ThisExpression":false,
        "Property":true,
        "PropertyDefinition":true,
        "MethodDefinition":true,

        "AwaitExpression":true,
        "SpreadElement":false,
        "AssignmentExpression":false,
        "LogicalExpression":false,
        "UnaryExpression":false,
        "TemplateLiteral":false,
        "BinaryExpression":false,
        "AssignmentPattern":false,
        "UpdateExpression":false,

        "ImportDeclaration":false,
        "ImportSpecifier":false,
        "ImportDefaultSpecifier":false,
        "ImportNamespaceSpecifier":false,
        "ExportNamedDeclaration":false,
        "ExportSpecifier":false,
        "ExportAllDeclaration":false,
        "ExportDefaultDeclaration":false,
    }

    var d3config={estreeops:types,fontsize:14}
    function setD3Config(conf){
        d3config=conf
    }
    function setCode(code){
        Code = code;
    }
    
    function getAst(code){
        var EStree=acorn.parse(code, option)
        return EStree
    }
    function traverseAst(node,callback){
        // console.log('traverseAst js', node);
        var isreturn=callback(node)
        if(isreturn===true)return
        Object.keys(node).forEach((key) => {
            const item = node[key]
            if (Array.isArray(item)&&key!='children'&&key!='range') {
              item.forEach((sub) => {
                sub!==null&&sub.type && traverseAst(sub, callback)
              })
            }
            item && item.type && traverseAst(item, callback)
        })
    }

    function getTokenizer(code){
        const tokens=[...acorn.tokenizer(code,option)]
    }
    function pruneJsonTree(json) {
        if (json && typeof json === 'object') {
          if (Array.isArray(json)) {
            return json.map(item => pruneJsonTree(item)).filter(item => item !== undefined);
          } else {
            const newObj = {};
            for (const key in json) {
              if (json.hasOwnProperty(key)) {
                const value = json[key];
                if (typeof value === 'object' || Array.isArray(value)) {
                  const prunedValue = pruneJsonTree(value);
                  if (prunedValue !== undefined) {
                    newObj[key] = prunedValue;
                  }
                } else if (types[json.type]) {
                  newObj[key] = value;
                }
              }
            }
            return Object.keys(newObj).length > 0 ? newObj : undefined;
          }
        } else {
          return json;
        }
    }

    function loc2poi(node){
        return {line:node.loc.start.line,start:node.loc.start.column}
    }

    function getRangeCode(node){
        if(node==null)return 'xx'
        var result=Code.slice(node.range[0],node.range[1])
        return result
    }

    function getArgs(nodes){
        var result=''
        for (let node of nodes){
            result+=getValue(node)+','
        }
        return result
    }

    function getValue(node){
        if(node===null||node===undefined)return ''
        if(d3config.estreeops[node.type]===false&&d3config.estreeops.all==false){
            return ''
        }
        switch(node.type){
            case "Program":
                return node.filename
            case "Identifier":
                return node.name
            case "Literal":
                return node.raw
            case "TemplateElement":
                return node.value.raw
            case "FunctionDeclaration":
                return `function ${getValue(node.id)}(${getArgs(node.params)})`
            case "FunctionExpression":
                return `function(${getArgs(node.params)})`
            case "ArrowFunctionExpression":
                return `(${getArgs(node.params)})=>{}`
            case "CallExpression":
                return getValue(node.callee)
            case "NewExpression":
                return getValue(node.callee)
            case "VariableDeclaration":
                return node.kind
            case "VariableDeclarator":
                return getValue(node.id)
            case "ExpressionStatement":
                return ''//getRangeCode(node)
            case "BlockStatement":
                return "{}"
            case "MemberExpression":
                return getValue(node.property)
            case "RegExpLiteral":
                return node.regex.pattern
            case "IfStatement":
                return 'if '+getRangeCode(node.test)
            case "SwitchStatement":
                return 'switch '+getRangeCode(node.discriminant)
            case "SwitchCase":
                return 'case '+getRangeCode(node.test)
            case "CatchClause":
                return 'catch '+getRangeCode(node.param)
            case "WhileStatement":
                return 'while '+getRangeCode(node.test)
            case "DoWhileStatement":
                return 'do '+getRangeCode(node.test)
            case "ForStatement":
                return 'for '+getRangeCode(node.test)
            case "ForInStatement":
                return `${getRangeCode(node.left)} in ${getRangeCode(node.right)}`
            case "ForOfStatement":
                return `${getRangeCode(node.left)} in ${getRangeCode(node.right)}`
            case "Property":
                return getValue(node.key)
            case "UnaryExpression":
                return node.operator
            case "UpdateExpression":
                return getValue(node.argument)+node.operator
            case 'LogicalExpression':
                return node.operator
            case "ConditionalExpression":
                return getRangeCode(node.test)
            case "ArrayPattern":
                return getArgs(node.elements)
            case "ObjectPattern":
                return getArgs(node.properties)
            case "TemplateLiteral":
                return getArgs(node.quasis)
            case "RestElement":
                return "..."+getValue(node.argument)
            case "BinaryExpression":
                return node.operator
            case "ClassDeclaration":
                return `class ${getValue(node.id)}${':'+getValue(node.superClass)}`
            case "MethodDefinition":
                return `${node.static?'static':''} ${node.kind} ${getValue(node.key)}`
            case "ImportDeclaration":
                return getValue(node.source)
            case "ImportSpecifier":
                return getValue(node.imported)
            case "ImportDefaultSpecifier":
                return node.local.name
            case "ImportNamespaceSpecifier":
                return node.local.name
            case "ExportNamedDeclaration":
                return getValue(node.source)
            case "ExportSpecifier":
                return getValue(node.exported)
            case "ExportAllDeclaration":
                return getValue(node.source)
            case "ExportDefaultDeclaration":
                return getValue(node.declaration)
            case "PropertyDefinition":
                return getValue(node.key)
            default:
                return node.type.replace('Statement','').replace('Declaration','').replace('Expression','');
        }
    }

    

    function analysisD3(node,file){
        node.name=getValue(node)
        node.poi=loc2poi(node)
        // console.log('js analysisD3',node.type,node.name,node
        switch(node.type){
            case "Program":
                node.children=node.body
                break
            case "Identifier":
                break
            case "FunctionDeclaration":
                node.children=[node.body]
                break
            case "FunctionExpression":
                node.children=[node.body]
                break
            case "ArrowFunctionExpression":
                node.children=[node.body]
                break
            case "CallExpression":
                node.children=node.arguments
                if(node.callee.type=="FunctionExpression")node.children.push(node.callee)//for self execute function
                break
            case "NewExpression":
                node.children=node.arguments
                break
            case "VariableDeclaration":
                node.children=node.declarations||[]
                break
            case "VariableDeclarator":
                node.children=[node.init]
                break
            case "ExpressionStatement":
                node.children=[node.expression]
                break
            case "BlockStatement":
                node.children=node.body
                break
            case "MemberExpression":
                node.children=[node.object]
                break
            case "ReturnStatement":
                node.children=[node.argument]
                break
            case "IfStatement":
                node.children=[node.consequent||{},node.alternate||{}]
                break
            case "SwitchStatement":
                node.children=node.cases||[]
                break
            case "SwitchCase":
                node.children=node.consequent
                break
            case "ThrowStatement":
                node.children=[node.argument]
                break
            case "TryStatement":
                node.children=[node.block,node.handler,node.finalizer||{}]
                break
            case "CatchClause":
                node.children=[node.body]
                break
            case "WhileStatement":
                node.children=[node.body]
                break
            case "DoWhileStatement":
                node.children=[node.body]
                break
            case "ForStatement":
                node.children=[node.body]
                break
            case "ForInStatement":
                node.children=[node.body]
                break
            case "ForOfStatement":
                node.children=[node.body]
                break
            case "ArrayExpression":
                node.children=node.elements
                break
            case "ObjectExpression":
                node.children=node.properties;
                break;
            case "Property":
                node.children=[node.value]
                break
            case "SequenceExpression":
                node.children=node.expressions
                break
            case "AwaitExpression":
                node.children=[node.argument]
                break
            case "SpreadElement":
                node.children=[node.argument]
                break
            case "AssignmentExpression":
                node.children=[node.left,node.right]
                break
            case "LogicalExpression":
                node.children=[node.left,node.right];
                break
            case "UnaryExpression":
                node.children=[node.argument]
                break
            case "ConditionalExpression":
                node.children=[node.consequent,node.alternate]
                break
            case "YieldExpression":
                node.children=[node.argument]
                break
            case "TemplateLiteral":
                node.children=node.expressions
                break
            case "BinaryExpression":
                node.children=[node.left,node.right]
                break
            case "AssignmentPattern":
                node.children=[node.left,node.right]
                break
            case "ClassDeclaration":
                node.children=[node.body]
                break
            case "ClassBody":
                node.children=node.body
                break
            case "MethodDefinition":
                node.children=[node.value]
                break
            case "ImportDeclaration":
                node.children=node.specifiers
                break
            case "ExportNamedDeclaration":
                node.children=node.specifiers
                break
            case "ChainExpression":
                node.children=[node.expression]
                break
            case "PropertyDefinition":
                node.children=[node.value]
                break

        }
        if(d3config.estreeops[node.type]===false&&d3config.estreeops.all==false){
            node.children=[]
        }

    }

    function analysisMermaid(node,file,r){
        // console.log('analysisMermaid',node)
        switch(node.type){
            case "FunctionDeclaration":
                traverseFunction(node,{},file)
                return true
            case "ClassDeclaration":
                if(!r.showMethod)break//
                traverseClass(node,file)
                return true
            case "VariableDeclaration":
                traverseAst(node,(n)=>{
                    if(n.type=="VariableDeclarator"){
                        node._name=getValue(n.id)
                    }
                    if(n.type=="ObjectExpression"){
                        traverseObject(n,node,file)
                        return true
                    }
                    if(n.type=="FunctionExpression"){
                        n.id={type:"Identifier",name:node._name,loc:{start:{},end:{}}}
                        traverseFunction(n,{},file)
                    }
                    if(n.type=="NewExpression"){
                        r.FlowVarNew[node._name]=getValue(n)
                    }
                })
                return true
        }
        function traverseClass(node,file){
            node._file=file
            node._value=getValue(node.id)
            node._flow_id=node._value
            if(r.FlowFilter[node._value]===false)return;
            r.FlowNode[node._flow_id]=node;
            if(r.FlowOne[node._flow_id]){
                r.FlowOne[node._flow_id].unshift(node._value)
            }else{
                r.FlowOne[node._flow_id]=[node._value]
            }
            r.Flow+=`    ${node._value}[${node._value}]\nclick ${node._value} "javascript:void(onFlowClick('${node._value}','${file}'))"\n`
            r.FDPNode[node._flow_id]={id:node._value,w:node._value.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${node._value}]`}
            r.UMLClass[node._value]={}
            r.UML+=`  class ${node._value}{\n`;
            for(let member of node.body.body){
                switch(member.type){
                    case "MethodDefinition":
                        member._value=getValue(member)
                        member._flow_id=member._value
                        let func=member.value
                        let _name=getValue(member.key)=="constructor"?'#'+node._value:getValue(member.key)
                        func.id={type:"Identifier",name:_name,loc:{start:{},end:{}}}
                        traverseFunction(func,node,file,true)
                        break;
                    case "PropertyDefinition":
                        traverseProperty(member,node,file,r)
                        break
                }
            }
            r.UML+='  }\n'
            if(node.superClass){
                var f=getValue(node.superClass)
                    if(r.FDPNode[f]===undefined){
                        r.FDPNode[f]={id:f,w:f.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${f}]`}
                    }    
                    r.UML+=`  ${f} <|-- ${node._value}\n`
                    r.FlowLink+=`${f} ==o ${node._value}\n` 
                    r.FDPLinks.push({source:f,target:node._value,value:6,dist:200,dash:"2,2"})
                    
            }
        }

        function traverseProperty(member,cls,file,r){
            member._value=getValue(member)
            member._flow_id=member._value
            member._flow_prop=`|${member._value.replaceAll('|','\|').replaceAll('[','').replaceAll(']','')}|`
            // if(r.FlowFilter[member._flow_id]===false)return;
            // r.FlowNode[member._flow_id]=member;
            r.UML+=`    ${member._value}\n`
            // console.log('traverse property',n)
            if(!r.showCall)return true
            var n=member.value
            if(n.type=="CallExpression"){
                n._file=file
                n._value=getValue(n)
                n._flow_id=n._value+'_'+member._flow_id
                n._flow_from=cls._flow_id
                n._flow_prop=member._flow_prop
                r.FlowNode[n._flow_id]=n
                if(r.FlowFilter[n._flow_id]===false)return true
                n._flow_str=`        ${n._flow_id}([${n._value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                r.FDPNode[n._flow_id]={id:n._flow_id,w:n._value.length*gD3fontSize/1.6+gD3fontSize*2,text:n._value+'()'}
                if(!r.FlowFilter[n._flow_id])return true
                r.Flow+=n._flow_str
                return true
            }else if(n.type=="NewExpression"){
                n._file=file
                n._value=getValue(n)
                n._flow_id=n._value+'_'+member._flow_id
                n._flow_from=cls._flow_id
                n._flow_prop=member._flow_prop
                r.FlowNode[n._flow_id]=n
                console.log('p var ',member._value,getValue(n))
                r.FlowVarNew[member._value]=getValue(n)
                if(r.FlowFilter[n._flow_id]===false)return true
                r.UMLClass[cls._value][n._flow_id]=n;
                n._flow_str=`        ${n._flow_id}[${n._value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                r.FDPNode[n._flow_id]={id:n._flow_id,w:n._value.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${n._value}]`}
                if(!r.FlowFilter[n._flow_id])return true
                r.Flow+=n._flow_str
                return true
            }
        }

        function traverseObject(n,node,file){
            for(let prop of n.properties){
                if(!prop.value)continue
                if(prop.value.type=="FunctionExpression"||prop.value.type=="ArrowFunctionExpression"){
                    prop.value.id={type:"Identifier",name:getValue(prop.key),loc:{start:{},end:{}}}
                    traverseFunction(prop.value,{},file)
                }
            }
        }

        function traverseFunction(member,cls,file,symbol){//member:function cls:parent function
            // console.log('traverse function',member)
            member._value=getValue(member.id)
            var method=cls._flow_id?member._value+'_'+cls._flow_id:member._value
            if(r.FlowOne[member._value]){
                r.FlowOne[member._value].unshift(method)
            }else{
                r.FlowOne[member._value]=[method]
            }
            member._flow_id=method
            member._flow_from=cls._flow_id
            member._file=file
            if(r.FlowFilter[member._flow_id]===false)return;
            r.FlowNode[member._flow_id]=member;
            r.FDPNode[member._flow_id]={id:member._flow_id,w:member._value.length*gD3fontSize/1.6+gD3fontSize*3,text:`${member._value}()`}
            r.Flow+=`    ${member._flow_id}([${member._value}])\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
            if(cls._flow_id){
                r.FlowLink+=`${cls._flow_id} --o ${member._flow_id}\n`
                r.FDPLinks.push({source:cls._flow_id,target:member._flow_id,value:2})
            }
            if(r.showCall){
                traverseAst(member.body,(n)=>{
                    return doBlock(n,member,file,r)
                })
            } 
            if(symbol)r.UML+=`    ${member._value}()\n`
        }
        function doBlock(n,node,file,r){
            // console.log('do block',n)
            if(!n)return
            if(n.type=="FunctionDeclaration"){
                traverseFunction(n,node,file)
                return true
            }else if(n.type=="ForStatement"||n.type=="WhileStatement"||n.type=="DoWhileStatement"||n.type=="ForInStatement"||n.type=="ForOfStatement"){
                n._file=file
                n._value="for"
                n._flow_id=n._value+n.start+'_'+node._flow_id
                n._flow_from=node._flow_id
                r.FlowNode[n._flow_id]=n
                if(r.showIf){
                    r.Flow+=`         ${n._flow_id}((${n._value}))\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                    r.FDPNode[n._flow_id]={id:n._flow_id,w:0,text:'🔵'}
                }  
                if(n.test&&getRangeCode(n.test))n._flow_condition='|'+getRangeCode(n.test).replaceAll('|','｜').replace('{','⌈').replace('}','⌋').replaceAll('[','⌈').replaceAll(']','⌋')+'|'
                if(n.right&&getRangeCode(n.right))n._flow_condition='|'+getRangeCode(n.right).replaceAll('|','｜').replace('{','⌈').replace('}','⌋').replaceAll('[','⌈').replaceAll(']','⌋')+'|'
                if(r.showIf&&n.body){
                    traverseAst(n.body,(nn)=>{
                        return doBlock(nn,n,file,r)
                    })
                }
                if(r.showIf)return true
            }else if(n.type=="IfStatement"){
                n._file=file
                n._value="if"
                n._flow_id=n._value+n.start+'_'+node._flow_id
                n._flow_from=node._flow_id
                r.FlowNode[n._flow_id]=n
                if(r.showIf){
                    r.Flow+=`        ${n._flow_id}{${n._value}}\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                    r.FDPNode[n._flow_id]={id:n._flow_id,w:0,text:'🔷'}
                }  
                if(n.test&&getRangeCode(n.test))n._flow_condition='|'+getRangeCode(n.test).replaceAll('|','｜').replaceAll('[','⌈').replaceAll(']','⌋')+'|'
                if(r.showIf&&n.consequent){
                    traverseAst(n.consequent,(nn)=>{
                        return doBlock(nn,n,file,r)
                    })
                }
                if(r.showIf&&n.alternate){
                    traverseAst(n.alternate,(nn)=>{
                        doBlock(nn,node,file,r)
                        if(n.alternate.type=="BlockStatement"){
                            return false
                        }
                        if(r.showIf)return true
                    })
                }
                if(r.showIf)return true
                
            }else if(n.type=="CallExpression"){
                n._file=file
                n._value=getValue(n)
                n._flow_id=n._value+'_'+node._flow_id
                n._flow_from=node._flow_id
                n._flow_callee=n.callee.name||n.callee.object?.name;
                if(n._flow_callee&&r.FlowNode[n._flow_id]){
                    n._flow_id=n._flow_callee+n._flow_id
                }
                r.FlowNode[n._flow_id]=n
                if(r.FlowFilter[n._flow_id]===false)return true
                n._flow_str=`        ${n._flow_id}([${n._value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                r.FDPNode[n._flow_id]={id:n._flow_id,w:n._value.length*gD3fontSize/1.6+gD3fontSize*2,text:n._value+'()'}
                if(!r.FlowFilter[n._flow_id])return true//for first click not render detail
                r.Flow+=n._flow_str
                return true
            }else if(n.type=="NewExpression"){
                n._file=file
                n._value=getValue(n)
                n._flow_id=n._value+'_'+node._flow_id
                n._flow_from=node._flow_id
                r.FlowNode[n._flow_id]=n
                if(r.FlowFilter[n._flow_id]===false)return true
                n._flow_str=`        ${n._flow_id}[${n._value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                r.FDPNode[n._flow_id]={id:n._flow_id,w:n._value.length*gD3fontSize/1.6+gD3fontSize*2,text:n._value}
                if(!r.FlowFilter[n._flow_id])return true//for first click not render detail
                r.Flow+=n._flow_str
                return true
            }else if(n.type=="VariableDeclarator"){
                traverseAst(n,(nn)=>{
                    if(nn.type=="NewExpression"){
                        console.log('block var',n,nn)
                        r.FlowVarNew[getValue(n)]=getValue(nn)
                    }
                })
            }
        }


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