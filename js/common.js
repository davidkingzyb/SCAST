var pre_search=null
var searchIterator=null
function search(){
    var s=document.getElementById('searchinput').value
    if(!pre_search||!searchIterator||s!=pre_search){
        pre_search=s
        searchIterator=document.getElementById('json').search(s)
    }
    console.log('search',pre_search)
    searchIterator.next()
}

function showJson(){
    console.log('gAst',gAst)
    var $json=document.getElementById('json')
    $json.data=JSON.parse(JSON.stringify(gAst))
}
function storageAstJson(){
    localStorage.setItem('SCAST_gAst',JSON.stringify(gAst))
}
function loadAstJson(aststr){
    gAst=JSON.parse(aststr||localStorage.getItem('SCAST_gAst'))
    var $code=document.getElementById('code')
    var html=''
    for(let ast in gAst){
        html+=`<details id="detail_${ast.replace('.','_')}">
                <summary onclick="scrollToView('detail_${ast.replace('.','_')}')">${ast}<a onclick="jumpOllama('${ast}')">${location.href.indexOf('davidkingzyb.tech')>=0?'🦙':''}</a></summary>
                <pre><code class="language-${gAst[ast].filetype}" id="${ast}">${gAst[ast].code.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
                </details>`
    }
    $code.innerHTML=html;
    hljs.highlightAll();
    hljs.initLineNumbersOnLoad();
    showJson()
}

function fixedCon(idname,status){
    var $con=document.getElementById(idname)
    if(status==0){
        $con.open=false
    }else if(status==1){
        $con.open=true
    }else if(status==-1){
        $con.open=!$con.open;
    }else if(status==2){
        $con.style.maxHeight="90%"
        setTimeout(()=>{
            $con.open=true
        },10)
    }
}
function scrollToView(id,dst){
    setTimeout(
        function(){
            if(dst&&document.getElementById('code_con').open){
                console.log('dst',dst)
                document.getElementById(id).scrollIntoView()
                window.scrollBy(0,dst)
            }else{
                document.getElementById(id).scrollIntoView({behavior:'smooth'})
            }  
        },1
    )
}

function saveScast(){
    var filename = window.prompt('💾save SCAST name', '');
    if(filename===null)return
    _saveFile(JSON.stringify(gAst),filename+'.ast')
}

function _saveFile(content, fileName) {
    var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    // if (location.href.indexOf('davidkingzyb.tech') < 0) return
    var q = RegExp('[?&]file=([^&]*)').exec(location.href); 
    var file=q && decodeURIComponent(q[1].replace(/\+/g, ' '))
    var fd = new FormData()
    if(file){
        fd.append('file', file)
    }else{
        fd.append('file', '/tmp/' + fileName)
    }
    fd.append('content', content)
    fetch('/save', { method: "POST", body: fd }).then(resp => {
        wtfmsg("save file ok")
    }).catch(err => {
        console.warn('save err')
    })
}

function initFile(){
    var q = RegExp('[?&]file=([^&]*)').exec(location.href); 
    var file=q && decodeURIComponent(q[1].replace(/\+/g, ' '))
    if(file){
        console.log('file',file)
        fetch('/rawtext?file='+file,{method:'GET'}).then(resp=>{
            return resp.text()
        }).then(text=>{
            loadAstJson(text)
        })
    }
}

// ========= Mermaid & FDP ===========
var gMermaidScale=1

function scaleMermaid(){
    gMermaidScale++;
    document.getElementById("mermaidPane").style.width=`${100*gMermaidScale}%`
}
function storageMermaid(){
    var $textUML=document.getElementById('textUML')
    var $textFlow=document.getElementById('textFlow')
    gMermaid.UML=$textUML.value
    gMermaid.Flow=$textFlow.value
    gMermaid.FlowLink=''
    localStorage.setItem('SCAST_gMermaid',JSON.stringify(gMermaid))
}
function loadMermaid(){
    var $textUML=document.getElementById('textUML')
    var $textFlow=document.getElementById('textFlow')
    gMermaid=JSON.parse(localStorage.getItem('SCAST_gMermaid'))
    $textUML.value=gMermaid.UML
    $textFlow.value=gMermaid.Flow
    renderMermaid()
}
function saveMermaid(){
    var $textUML=document.getElementById('textUML')
    var $textFlow=document.getElementById('textFlow')
    var filename = window.prompt('💾save mermaid name', '');
    if(filename===null)return
    _saveFile(JSON.stringify(gMermaid),filename+'.mmdj')
    _saveFile($textUML.value,filename+'_UML.mmd')
    _saveFile($textFlow.value.replace(/click.*?\n/g,''),filename+'_flow.mmd')
    mermaid.render('mermaidUML',$textUML.value).then(function(svg){
        _saveFile(svg.svg,filename+'_UML.svg')
    })
    mermaid.render('mermaidFlow',$textFlow.value.replace(/click.*?\n/g,'')).then(function(svg){
        _saveFile(svg.svg,filename+'_flow.svg')
    })
}
function reMermaid(){
    var $textUML=document.getElementById('textUML')
    var $textFlow=document.getElementById('textFlow')
    gMermaid.UML=$textUML.value
    gMermaid.Flow=$textFlow.value
    gMermaid.FlowLink=''
    renderMermaid()
    setTimeout(()=>{
        document.getElementById('mermaid_conf_con').open=false;
    },10)
}
function onFDPClick(id){
    var node=gMermaid.FlowNode[id]
    console.log(node)
    onFlowClick(id,node._file)
}
function onFlowClick(n,file,time=5000){
    var node=gMermaid.FlowNode[n]
    if(!node)return
    var fileid=file.replace('.','_')
    console.log(`flow click ${n} ${fileid} ${file}(${node.poi.line}:${node.poi.start})`,node)
    document.getElementById('code_con').open=open;
    var $detail=document.getElementById('detail_'+fileid)
    $detail.open=true
    var $line=document.querySelectorAll(`#detail_${fileid} .hljs-ln-line`)
    for(let $l of $line){
        if($l.getAttribute('data-line-number')==node.poi.line){
            $l.style.backgroundColor = "#ffb02e";
            $l.scrollIntoView()
            document.getElementById('code_con').scrollBy(0,-100)
            setTimeout(()=>{
                $l.style.backgroundColor = "#8b5600";
            },3000)
            break;
        }
    }
    if(node._analysis)wtfmsg(`${gIconmap[node.type]}${node.value||node._value}:${node._analysis}`,time)
}
var gIconmap={
    "NewExpression":'🆕',
    "CallExpression":'📞',
    "FunctionDefine":'🟦',
    "FunctionDeclaration":'🟦',
    "InterfaceDefine":'🔌',
    "MethodDefine":'Ⓜ️',
    "FunctionExpression":'Ⓜ️',
    "ClassDefine":'🆑',
    "ClassDeclaration":'🆑',
}
function renderMermaidFilter(){
    var html=''
    if(gMermaid){
        for(let k of Object.keys(gMermaid.FlowNode).sort()){
            let node=gMermaid.FlowNode[k]
            if(gIconmap[node.type]){
                let nodev=node.value||node._value
                if(gMermaid.FlowFilter[k]===undefined){
                    if(gMermaid.FlowOne[nodev]){
                        gMermaid.FlowFilter[k]=true
                    }else{
                        gMermaid.FlowFilter[k]=false
                    }
                } 
                html+=`
<input onchange="onMermaidFilter(this.value)" value="${k}" type="checkbox" id="mmdft_${k}" class="mmdft" ${gMermaid.FlowFilter[k]?"checked":""}/>
<a class="pointer" onclick="onOutlineIconClick('${node._flow_id||nodev}')">${gIconmap[node.type]}</a>
<label onclick="onFlowClick('${k}','${node._file}')" title="${node._analysis||''}"> ${nodev} </label>`
            }
        }
    }
    document.getElementById('mmdfilter_con').innerHTML=html
}
function onOutlineIconClick(_flow_id){
    var node=gMermaid.FlowNode[_flow_id]
    onFlowClick(_flow_id,node._file,-1)
}
function onMermaidFilter(v){
    // console.log('mermaid filter', v);
    // gMermaid.FlowNode[v]=document.getElementById('mmdft_'+v).checked
    gMermaid.FlowFilter[v]=document.getElementById('mmdft_'+v).checked
    renderMermaidFilter()
}
function renderMermaid(){
    var $textUML=document.getElementById('textUML')
    var $textFlow=document.getElementById('textFlow')
    var $FDP=document.getElementById('FDP')
    var $mermaidPane=document.getElementById('mermaidPane')
    $textUML.value=gMermaid.UML;
    $textFlow.value=gMermaid.Flow+'\n'+gMermaid.FlowLink;
    $mermaidPane.innerHTML=$textUML.value=='classDiagram\n'?"":`<pre class="mermaid" id="mermaidUML">${$textUML.value}</pre>`
    $mermaidPane.innerHTML+=`<pre class="mermaid" id="mermaidFlow">${$textFlow.value}</pre>`
    try{
        mermaid.run({
            querySelector: '.mermaid',
        })
    }catch(e){
        wtfmsg('mermaid render fail,try to fix mermaid code and click 🔄️ render again.')
        console.warn('render mermaid fail')
    }
    
    $FDP.innerHTML=''
    $FDP.append(D3M.disjointForce({nodes:Object.values(gMermaid.FDPNode),links:gMermaid.FDPLinks},onFDPClick))
}
// =========== D3 ==============
var gD3Scale=1
var gD3fontSize=14
function fontSizeD3Minus(v){
    gD3fontSize=gD3fontSize-v
}
function fontSizeD3Plus(v){
    gD3fontSize=gD3fontSize+v
}
function renderD3Option(){
    var eshtml=`<input type="checkbox" id="d3esop_all" class="d3ops"/><label for="d3esop_all">all</label> `
    for(let op in ESTREEJS.types){
        eshtml+=`<input type="checkbox" id="d3esop_${op}" class="d3ops" ${ESTREEJS.types[op]?"checked":''} /><label for="d3esop_${op}">${op}</label> `
    }
    document.getElementById("D3ESTree").innerHTML=eshtml

    var html=`<input type="checkbox" id="d3op_all" class="d3ops"/><label for="d3op_all">all</label> `
    for(let op in SCAST.types){
        html+=`<input type="checkbox" id="d3op_${op}" class="d3ops" ${SCAST.types[op]?"checked":''} /><label for="d3op_${op}">${op}</label> `
    }
    document.getElementById("D3Option").innerHTML=html
}
function getSCASTD3Option(){
    var result=JSON.parse(JSON.stringify(SCAST.types))
    for(let op in result){
        result[op]=document.getElementById('d3op_'+op).checked
    }
    result['all']=document.getElementById('d3op_all').checked
    return result
}
function getESTreeD3Option(){
    var result=JSON.parse(JSON.stringify(ESTREEJS.types))
    for(let op in result){
        result[op]=document.getElementById('d3esop_'+op).checked
    }
    result['all']=document.getElementById('d3esop_all').checked
    return result
}
function scaleD3(){
    gD3Scale++;
    document.getElementById("D3Diagram").style.width=`${100*gD3Scale}%`
}
function clearD3(){
    document.getElementById('D3Diagram').innerHTML='';
}
function renderD3(type,data){
    var svgnode=D3M[type](data)
    document.getElementById('D3Diagram').append(svgnode)
}
function saveD3(){//svg not work
    var svgnode=D3M[gD3.select](gD3.tree)
    _saveFile(svgnode.outerHTML,'StaticCodeAnalysis_'+gD3.select+'.svg')
}

function initCodeScaler(){
    var isCodeScaler=false
    var isMax=false;
    var $scaler=document.getElementById('codescaler');
    var $codecon=document.getElementById('code_con')
    var $codepanel=document.getElementById('code_panel')
    var $codescroll=document.getElementById('code_scroll')
    $codecon.addEventListener('toggle',(e)=>{
        if($codecon.open){
            $codepanel.style.display = 'block';
        }else{
            $codepanel.style.display = 'none'
        }
    })
    
    $scaler.addEventListener('mousedown',()=>{
        isCodeScaler=true
        document.body.style.userSelect='none'
    })
    document.addEventListener('mouseup',()=>{
        // console.log('up')
        isCodeScaler=false
        document.body.style.userSelect=''
    })
    document.addEventListener('mousemove',(e)=>{
        if(isCodeScaler){
            var cx = e.clientX;
            var cy = e.clientY;
            $codepanel.style.width=(cx-15)+'px'
            $codepanel.style.height=(cy-15)+'px'
            $codescroll.style.width=(cx-15)+'px'
            $codescroll.style.height=(cy-15)+'px'
        }
    })

    $scaler.addEventListener('touchend',()=>{
        if(isMax){
            isMax=false
            $codepanel.style.width='625px'
            $codepanel.style.height='430px'
            $codescroll.style.width='625px'
            $codescroll.style.height='430px'
        }else{
            $codepanel.style.width='100vw'
            $codepanel.style.height=(window.screen.height-110)+'px'
            $codescroll.style.width='100vw'
            $codescroll.style.height=(window.screen.height-110)+'px'
            isMax=true
        }
        
    })
    
}

function wtfmsg(m,time=3000){
	var elem=document.createElement('div')
	elem.className="wtfmsg"
	elem.innerHTML=m
    var bottom=(document.querySelectorAll('.wtfmsg').length+1)*50+10
    elem.style.bottom=`${bottom}px`
	document.body.appendChild(elem)
    if(time<0){
        elem.onclick=()=>{
            document.body.removeChild(elem)
        }
    }else{
        setTimeout(()=>{
            document.body.removeChild(elem)
        },time)
    }
}