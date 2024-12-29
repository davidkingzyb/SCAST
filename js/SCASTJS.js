var SCASTJS=(function(){

    const option={
        ecmaVersion: 2022,
        locations:true,
        ranges:true,
    }
    var EStree={}
    var AST={}
    var Code='';

    var types={
        "FunctionDeclaration":true,
        "VariableDeclarator":false,
        "CallExpression":true,
        "Program":true,
        "BlockStatement":false,
    }
    
    function getAst(code){
        Code = code;
        EStree=acorn.parse(code, option)
        // AST=pruneJsonTree(EStree)
        console.log("SCASTJS ESTree",EStree)
        return EStree
    }
    function traverseAst(node,callback){
        // console.log('traverseAst js', node);
        callback&&callback(node)
        Object.keys(node).forEach((key) => {
            const item = node[key]
            if (Array.isArray(item)&&key!='children') {
              item.forEach((sub) => {
                sub.type && traverseAst(sub, callback)
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

    function loc2poi(loc){
        return {line:loc.start.line,start:loc.start.column}
    }

    function getRangeCode(node){
        if(node==null)return ''
        var result=Code.slice(node.range[0],node.range[1])
        return result
    }

    function getValue(node){
        if(node===null||node===undefined)return ''
        switch(node.type){
            case "Program":
                return node.filename
            case "Identifier":
                return node.name
            case "FunctionDeclaration":
                return getValue(node.id)
            case "CallExpression":
                return getValue(node.callee)
            case "NewExpression":
                return getValue(node.callee)
            case "VariableDeclaration":
                return node.kind
            case "VariableDeclarator":
                return getValue(node.id)
            case "ExpressionStatement":
                return getRangeCode(node)
            case "BlockStatement":
                return "{}"
            case "MemberExpression":
                return getValue(node.property)
            case "Literal":
                return node.raw
            case "RegExpLiteral":
                return node.regex.pattern
            case "IfStatement":
                return getRangeCode(node.test)
            case "SwitchStatement":
                return getRangeCode(node.discriminant)
            case "SwitchCase":
                return getRangeCode(node.test)
            case "CatchClause":
                return getRangeCode(node.param)
            case "WhileStatement":
                return getRangeCode(node.test)
            case "DoWhileStatement":
                return getRangeCode(node.test)
            case "ForStatement":
                return getRangeCode(node.test)
            case "ForInStatement":
                return `${getRangeCode(node.left)} in ${getRangeCode(node.right)}`
            case "ForOfStatement":
                return `${getRangeCode(node.left)} in ${getRangeCode(node.right)}`
            case "Property":
                return getValue(node.key)
            default:
                return node.type.replace('Statement','').replace('Declaration','').replace('Expression','');
        }
    }

    

    function analysisD3(node,file){
        node.name=getValue(node)
        node.poi=loc2poi(node.loc)
        console.log('js analysisD3',node.type,node.name,node)
        switch(node.type){
            case "Program":
                node.children=node.body
                break
            case "Identifier":
                break
            case "FunctionDeclaration":
                node.children=[node.body]
                break
            case "CallExpression":
                node.children=node.arguments
                break
            case "NewExpression":
                node.children=node.arguments
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
            case "VariableDeclaration":
                node.children=node.declarations||[]
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
            
        }

    }

    function analysisMermaid(node,file,r){

    }

    

    return {
        getAst:getAst,
        traverseAst:traverseAst,
        analysisMermaid:analysisMermaid,
        analysisD3:analysisD3,
        types:types,
    }

})()