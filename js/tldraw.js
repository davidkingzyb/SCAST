
function saveTldraw(){
    console.log('saveTldraw')
    var create=[]
    create.push({
        "id":"shape:scast_UML",
        "type":"html",
        "x":0,
        "y":0,
        "props":{
            "html":`<div style="margin-top:1rem">${document.getElementById('mermaidUML').innerHTML}</div>`,
            "w":800,
            "h":600,
            "copybtn":true,
            "canEdit":true
        }
    })
    create.push({
        "id":"shape:scast_Flow",
        "type":"html",
        "x":0,
        "y":650,
        "props":{
            "html":`<div style="margin-top:1rem">${document.getElementById('mermaidFlow').innerHTML}</div>`,
            "w":800,
            "h":600,
            "copybtn":true,
            "canEdit":true
        }
        
    })
    var $codes=document.querySelectorAll("#code pre")
    for(let i=0;i<$codes.length;i++){
        create.push({
            "id":"shape:scast_code_"+i,
            "type":"html",
            "x":850+850*i,
            "y":0,
            "props":{
                "html":`<div style="margin:15px 5px;"><pre style="background:#111;color:white;">${$codes[i].outerHTML}<pre></div>`,
                "w":800,
                "h":1500,
                "copybtn":true,
                "canEdit":true
            }
            
        })
    }
    var filename = window.prompt('💾save tldraw file name', '');
    if(filename===null)return
    _saveFile(JSON.stringify({create:create}),filename+'.tld')

}