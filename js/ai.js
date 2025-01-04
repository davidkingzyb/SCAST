gISAI=true
async function aiAnalysis(){
    for(let ast in gAst){
        await codeAgent(gAst[ast])
    }
    loadAstJson(JSON.stringify(gAst))
}

function codeAgent(asttop){
    // if (location.href.indexOf('davidkingzyb.tech') < 0) return
    var query={
        'stream':false,
        'messages':[
            {
                'role':'system',
                'content':'_codeAnalysis',
            },
            {
                'role':'system',
                'content':asttop.code,
                '_type':'ref'
            }
        ]
    }
    return fetch('/pi_chat',{method:"POST",headers: {
        'Content-Type': 'application/json'
    },body: JSON.stringify(query)}).then(response=>{return response.json()}).then(resp=>{
        console.log(resp)
        if(resp.code){
            console.log(resp.data.message.content,asttop)
            asttop.analysis=resp.data.message.content
            return true
        }
        return false
    }).catch(err=>{
        console.warn('code Agent fail')
        return false
    })
}

function jumpOllama(asttop){
    console.log('jumpOllama',asttop)
    var temp = document.createElement("form");      
        temp.action = '/ollama';      
        temp.method = "post";      
        temp.style.display = "none";      
        var opt = document.createElement("textarea");      
        opt.name = 'reftxt';      
        opt.value = gAst[asttop].code;       
        temp.appendChild(opt);      
        document.body.appendChild(temp);      
        temp.submit();      
}


