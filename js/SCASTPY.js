var SCASTPY=(function(){
    var types={
        FunctionDeclaration:true,
        BlockStatement:true,
        VariableDeclaration:true,
    }

    function getAst(code){
        return filbert.parse(code)
    }
    function traverseAst(node,callback){
        console.log('traverseAst',node.type,node)
        callback&&callback(node)
        Object.keys(node).forEach((key) => {
            const item = node[key]
            if (Array.isArray(item)) {
              item.forEach((sub) => {
                sub.type && traverseAst(sub, callback)
              })
            }
            item && item.type && traverseAst(item, callback)
          })
    }
    function analysisMermaid(node,file,r){

    }
    function analysisD3(node,file){
        node.children=[]
        if(node.body&&node.body.length>0){
            for(let b of node.body){
                if(gD3.options[b.type]||gD3.options.all){
                    node.children.push(b)
                }
            }
        }

    }

    

    return {
        getAst:getAst,
        traverseAst:traverseAst,
        analysisMermaid:analysisMermaid,
        analysisD3:analysisD3,
        types:types
    }

})()