var SCASTJS=(function(){
    var types={

    }

    function getAst(code){
        return acorn.parse(code, {ecmaVersion: 2020})
    }
    function traverseAst(node,callback){

    }
    function analysisMermaid(node,file,r){

    }
    function analysisD3(node,file){

    }

    

    return {
        getAst:getAst,
        traverseAst:traverseAst,
        analysisMermaid:analysisMermaid,
        analysisD3:analysisD3,
        types:types
    }

})()