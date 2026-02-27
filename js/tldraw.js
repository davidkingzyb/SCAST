
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
window.onload=function(){
    var $code_panel=document.getElementById('code_panel')
    $code_panel.ondragover=function(){
    var isLink = event.dataTransfer.types.indexOf("text/uri-list")>=0;
            if (isLink) {
                event.preventDefault();
            }
    }
    $code_panel.ondrop=function(){
    const url = event.dataTransfer.getData("text/uri-list");
            var file=new URLSearchParams((new URL(url)).search).get('file');
            console.log('ondrop',url,file)
            if(file){
                var fd = new FormData()
                fd.append('file', file)
    fetch('/rawtext', { method: "POST", body: fd }).then(resp => {
        return resp.text()
    }).then(resp=>{
        document.getElementById("codetext").value=resp
    }).catch(err => {
        console.warn('rawtext err')
    })
            }
    }
}