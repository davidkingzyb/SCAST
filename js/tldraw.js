
function saveTldraw(){
    console.log('saveTldraw')
    var create=[]
    var $uml=document.getElementById('mermaidUML')
    var yy=0
    if($uml){
        create.push({
            "id":"shape:scast_UML",
            "type":"html",
            "x":0,
            "y":yy,
            "props":{
                "html":`<div style="margin-top:1rem">${$uml.innerHTML}</div>`,
                "w":$uml.getBoundingClientRect().width,
                "h":$uml.getBoundingClientRect().height,
                "copybtn":true,
                "canEdit":true
            }
        })
        yy+=$uml.getBoundingClientRect().height+50
    }
    
    var $flow=document.getElementById('mermaidFlow')
    if($flow){
        create.push({
            "id":"shape:scast_Flow",
            "type":"html",
            "x":0,
            "y":yy,
            "props":{
                "html":`<div style="margin-top:1rem">${$flow.innerHTML}</div>`,
                "w":$flow.getBoundingClientRect().width,
                "h":$flow.getBoundingClientRect().height,
                "copybtn":true,
                "canEdit":true
            }
            
        })
        yy+=$flow.getBoundingClientRect().height+50
    }
    
    var xx=0
    var $codes=document.querySelectorAll("#code pre")
    for(let i=0;i<$codes.length;i++){
        let w=$codes[i].getBoundingClientRect().width||800
        let h=$codes[i].getBoundingClientRect().height||600
        xx=xx-50-w
        create.push({
            "id":"shape:scast_code_"+i,
            "type":"html",
            "x":xx,
            "y":0,
            "props":{
                "html":`<div style="margin:15px 5px;"><pre style="background:#111;color:white;">${$codes[i].outerHTML}<pre></div>`,
                "w":w,
                "h":h,
                "copybtn":true,
                "canEdit":true
            }
            
        })
    }
    var filename = window.prompt('💾save tldraw file name', '');
    if(filename===null)return
    _saveFile(JSON.stringify({create:create}),filename+'.tld')

}