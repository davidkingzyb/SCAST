var gAst={}

function load() {
    var $file = document.getElementById('codefile')
    var $code=document.getElementById('code')
    var $codetext=document.getElementById('codetext')
    var html=''
    if($codetext&&$codetext.value){
        html=`<details id="detail_code">
            <summary>code</summary>
            <pre><code class="language-cs" id="codetext">${$codetext.value.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
        </details>`;
        gAst.code=SCAST.getAst($codetext.value,'code')
        gAst.code['code']=$codetext.value
        gAst.code['filetype']=''
        $code.innerHTML=html;
        hljs.highlightAll();
        hljs.initLineNumbersOnLoad();
    }
    for(let i=0;i<$file.files.length;i++){
        let r = new FileReader()
        r.onload = function (e) {
            let t=r._filename.split('.')
            var c=e.target.result
            gAst[t[0]]=SCAST.getAst(c.replace(/\r\n/g,'\n'),t[0])
            gAst[t[0]]['code']=c
            gAst[t[0]]['filetype']=t[1]
            html+=`<details id="detail_${t[0]}">
                <summary onclick="scrollToView('detail_${t[0]}')">${r._filename}</summary>
                <pre><code class="language-${t[1]}" id="${t[0]}">${c.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
                </details>`
            $code.innerHTML=html;
            hljs.highlightAll();
            hljs.initLineNumbersOnLoad();
        }
        r.readAsText($file.files[i])
        r._filename=$file.files[i].name
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
function showJson(){
    console.log('gAst',gAst)
    var $json=document.getElementById('json')
    $json.data=JSON.parse(JSON.stringify(gAst))
}
function storageAstJson(){
    localStorage.setItem('SCAST_gAst',JSON.stringify(gAst))
}
function loadAstJson(){
    gAst=JSON.parse(localStorage.getItem('SCAST_gAst'))
    var $code=document.getElementById('code')
    var html=''
    for(let ast in gAst){
        html+=`<details id="detail_${ast}">
                <summary onclick="scrollToView('detail_${ast}')">${ast}.${gAst[ast].filetype}</summary>
                <pre><code class="language-${gAst[ast].filetype}" id="${ast}">${gAst[ast].code.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
                </details>`
    }
    $code.innerHTML=html;
    hljs.highlightAll();
    hljs.initLineNumbersOnLoad();
    showJson()
}
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

function saveScast(){
    var filename = window.prompt('💾save SCAST name', '');
    if(filename===null)return
    _saveFile(JSON.stringify(gAst),filename+'.ast')
}

mermaid.initialize({ startOnLoad: false,securityLevel: 'loose', });
var gMermaid;
var $mermaidPane=document.getElementById('mermaidPane')
var $textUML=document.getElementById('textUML')
var $mermaidUML=document.getElementById('mermaidUML');
var $textFlow=document.getElementById('textFlow')
var $mermaidFlow=document.getElementById('mermaidFlow')
var $FDP=document.getElementById('FDP')

function renderMermaid(){
    $textUML.value=gMermaid.UML;
    $textFlow.value=gMermaid.Flow+'\n'+gMermaid.FlowLink;
    $mermaidPane.innerHTML=`<pre class="mermaid" id="mermaidUML">${$textUML.value}</pre><pre class="mermaid" id="mermaidFlow">${$textFlow.value}</pre>`

    mermaid.run({
        querySelector: '.mermaid',
    })

    $FDP.innerHTML=''
    $FDP.append(D3M.disjointForce({nodes:Object.values(gMermaid.FDPNode),links:gMermaid.FDPLinks},onFDPClick))
}
var gIconmap={
    "NewExpression":'🆕',
    "CallExpression":'📞',
    "FunctionDefine":'🟦',
    "InterfaceDefine":'🔌',
    // "IfStatement":'🔷',
    // "LoopStatement":'🔵',
    "MethodDefine":'Ⓜ️',
    "ClassDefine":'🆑',
}
function renderMermaidFilter(){
    
    var html=''
    if(gMermaid){
        for(let k of Object.keys(gMermaid.FlowNode).sort()){
            let node=gMermaid.FlowNode[k]
            if(gIconmap[node.type]){
                if(gMermaid.FlowFilter[k]===undefined){
                    if(gMermaid.FlowOne[node.value]){
                        gMermaid.FlowFilter[k]=true
                    }else{
                        gMermaid.FlowFilter[k]=false
                    }
                } 
                html+=`<input onchange="onMermaidFilter(this.value)" value="${k}" type="checkbox" id="mmdft_${k}" class="mmdft" ${gMermaid.FlowFilter[k]?"checked":""}/><a class="pointer" onclick="onFlowClick('${k}','${node._file}')">${gIconmap[node.type]}</a><label onclick="onFlowClick('${k}','${node._file}')"> ${node.value} </label>`
            }
        }
    }
    document.getElementById('mmdfilter_con').innerHTML=html
}

function onMermaidFilter(v){
    // console.log('mermaid filter', v);
    // gMermaid.FlowNode[v]=document.getElementById('mmdft_'+v).checked
    gMermaid.FlowFilter[v]=document.getElementById('mmdft_'+v).checked
    renderMermaidFilter()
}

function onFDPClick(id){
    var node=gMermaid.FlowNode[id]
    console.log(node)
    onFlowClick(id,node._file)
}

function onFlowClick(n,file){
    var node=gMermaid.FlowNode[n]
    if(!node)return
    console.log(`flow click ${n} ${file}(${node.poi.line}:${node.poi.start})`,node)
    document.getElementById('code_con').open=open;
    var $detail=document.getElementById('detail_'+file)
    $detail.open=true
    var $line=document.querySelectorAll(`#detail_${file} .hljs-ln-line`)
    for(let $l of $line){
        if($l.getAttribute('data-line-number')==node.poi.line){
            $l.style.backgroundColor = "red";
            $l.scrollIntoView({behavior:'smooth'})
            setTimeout(()=>{
                $l.style.backgroundColor = "#994a43";
            },3000)
            break;
        }
    }
}

function reMermaid(){
    gMermaid.UML=$textUML.value
    gMermaid.Flow=$textFlow.value
    gMermaid.FlowLink=''
    renderMermaid()
}

var gMermaidScale=1
function scaleMermaid(){
    gMermaidScale++;
    document.getElementById("mermaidPane").style.width=`${100*gMermaidScale}%`
}

function storageMermaid(){
    gMermaid.UML=$textUML.value
    gMermaid.Flow=$textFlow.value
    gMermaid.FlowLink=''
    localStorage.setItem('SCAST_gMermaid',JSON.stringify(gMermaid))
}
function loadMermaid(){
    gMermaid=JSON.parse(localStorage.getItem('SCAST_gMermaid'))
    $textUML.value=gMermaid.UML
    $textFlow.value=gMermaid.Flow
    renderMermaid()
}
function saveMermaid(){
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

function genMermaid(){
    var r={
        UML:'classDiagram\n',
        Flow:'flowchart LR\n',
        FlowLink:'',
        FlowNode:{},
        FlowOne:{},
        FlowFilter:gMermaid&&gMermaid.FlowFilter||{},  
        UMLClass:{},
        showCondition:document.getElementById('mmdop_condition').checked,
        showRelation:document.getElementById('mmdop_relation').checked,
        showMethod:document.getElementById('mmdop_method').checked,
        showIf:document.getElementById('mmdop_if').checked,
        idone:document.getElementById('mmdop_idone').checked,
        showCall:document.getElementById('mmdop_call').checked,
        showNamespace:document.getElementById('mmdop_namespace').checked,
        FDPNode:{},
        FDPLinks:[],
    }
    for(let file in gAst){
        r.Flow+=`  subgraph ${file}.file\n   direction TB\n`;
        let namespace=null;
        SCAST.traverseAst(gAst[file],function(node){
            switch(node.type){
                case 'ClassDefine':
                    if(!r.showMethod)break
                    if(r.FlowFilter[node.value]===false)break;
                    r.Flow+=`    ${node.value}[${node.value}]\nclick ${node.value} "javascript:void(onFlowClick('${node.value}','${file}'))"\n`
                    r.FDPNode[node.value]={id:node.value,w:node.value.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${node.value}]`}
                    traverseClass(node,file)
                    break;
                case 'InterfaceDefine':
                    if(!r.showMethod)break
                    if(r.FlowFilter[node.value]===false)break;
                    r.Flow+=`    ${node.value}{{${node.value}}}\nclick ${node.value} "javascript:void(onFlowClick('${node.value}','${file}'))"\n`
                    r.FDPNode[node.value]={id:node.value,w:node.value.length*gD3fontSize/1.6+gD3fontSize*2,text:`{${node.value}}`}
                    traverseClass(node,file)
                    break;
                case 'NamespaceDefine':
                    if(!r.showMethod)break
                    if(!r.showNamespace)break;
                    if(namespace){
                        r.Flow+=`  end\n  subgraph ${node.value}.namespace\n`
                    }else{
                        r.Flow+=`  subgraph ${node.value}.namespace\n`
                        namespace=node.value;
                    }
                    break;
                case "FunctionDefine":
                    if(r.showMethod)break
                    // console.log('function define',node)
                    traverseMethod(node,{},file)
                    break
                case "MethodDefine":
                    if(r.showMethod)break
                    // console.log("method",node)
                    traverseMethod(node,{},file)
                    break
                case "Variable":
                    if(r.showMethod)break
                    traverseVariable(node,{},file)
                    break
                
            }
        })
        if(namespace)r.Flow+=`  end\n`
        r.Flow+=`  end\n`
    }
    if(r.showRelation&&gMermaid){//第一次不渲染依赖
        for(let ucls in r.UMLClass){//class 间依赖关系
            for(let x in r.UMLClass[ucls]){
                if(gMermaid&&gMermaid.FlowFilter[x]==false)continue
                if(ucls===x||ucls===x.split('_')[0])continue
                var v=r.UMLClass[ucls][x]
                if(v.type=='NewExpression'){
                    r.UML+=`${ucls}..>${v.value}\n`
                }
            }
        }
    }

    if(gMermaid&&r.showCall){//traverse FlowNode
        for(let nk in r.FlowNode){
            let node=r.FlowNode[nk]
            if(r.FlowFilter[node._flow_id]===false)continue
            if(node.type=='NewExpression'||node.type=='CallExpression'){
                if(r.idone&&r.FlowOne[node.value]){
                    r.Flow=r.Flow.replaceAll(node._flow_str,'')
                    delete r.FDPNode[node._flow_id]
                    r.FlowLink+=`${node._flow_from} -..-> ${node._flow_prop||''} ${r.FlowOne[node.value]}\n`
                    r.FDPLinks.push({source:node._flow_from,target:r.FlowOne[node.value],value:2,dash:"5,5",dist:100,strength:0.1})
                }else{
                    r.FlowLink+=`${node._flow_from} -..-> ${node._flow_prop||''} ${node._flow_id}\n`
                    r.FDPLinks.push({source:node._flow_from,target:node._flow_id,value:2,dash:"5,5",dist:100,strength:0.1})
                }
            }else if((node.type=="IfStatement"||node.type=="LoopStatement")&&r.showIf){
                r.FlowLink+=`${node._flow_from} -..-> ${r.showCondition&&node._flow_condition||''} ${node._flow_id}\n`
                r.FDPLinks.push({source:node._flow_from,target:node._flow_id,value:2,dash:"5,5",dist:100,strength:0.1})
            }
        }
    }
    gMermaid=r;
    console.log('gMermaid',gMermaid)
    renderMermaid()
    renderMermaidFilter()

    function traverseClass(node,file){
        node._file=file
        r.FlowNode[node.value]=node;
        r.FlowOne[node.value]=node.value
        r.UMLClass[node.value]={}
        var level_symbol={
            'public':'+',
            "private":'-',
            "protected":'#',
            "internal":'~',
            "static":'$',
        }
        r.UML+=`  class ${node.value}{\n`;
        // if(node.type=="InterfaceDefine"){
            // r.UML+=`     <<interface>> ${node.value}\n`;//mermaid bug
        // }
        for(let member of node.body){
            let symbol=member.level&&level_symbol[member.level]?level_symbol[member.level]:' ';
            switch(member.type){
                case "PropertyDefine":
                    traverseProperty(member,node,file,symbol)
                    break;
                case "MethodDefine":
                    traverseMethod(member,node,file,symbol)
                    break;
                case "FunctionDefine":
                    traverseMethod(member,node,file,symbol)
                    break;
            }
        }
        r.UML+='  }\n'
        if(node.extends){
            for(let f of node.extends){
                if(r.FlowNode[f]&&r.FlowNode[f].type=="InterfaceDefine"){
                    r.FDPNode[f]={id:f,w:f.length*gD3fontSize/1.6+gD3fontSize*2,text:`{${f}}`}
                    r.UML+=`  ${f} <|.. ${node.value}\n`
                    r.FlowLink+=`${f} ==> ${node.value}\n` 
                    r.FDPLinks.push({source:node.value,target:f,value:6,dist:200,dash:'2,2'})
                }else{
                    if(r.FDPNode[f]===undefined)r.FDPNode[f]={id:f,w:f.length*gD3fontSize/1.6+gD3fontSize*2,text:`[${f}]`}
                    r.UML+=`  ${f} <|-- ${node.value}\n`
                    r.FlowLink+=`${f} ==o ${node.value}\n` 
                    r.FDPLinks.push({source:f,target:node.value,value:6,dist:200,dash:"2,2"})
                }
            }
        }
    }

    function traverseProperty(member,cls,file,symbol){
        member._flow_id=member.value+'_'+cls.value
        member._flow_from=cls.value
        member._flow_prop=`|${symbol}${member.value.replaceAll('|','\|').replaceAll('[','').replaceAll(']','')}|`
        member._file=file
        if(r.FlowFilter[member._flow_id]===false)return;
        r.FlowNode[member._flow_id]=member;
        r.UML+=`    ${symbol}${member.value}\n`
        // console.log('prop',member)
        if(r.showCall)_doBody(member,file)
        function _doBody(node,file){
            if(!node.body)return
            for(let n of node.body ){
                n._file=file
                n._flow_id=n.value+'_'+node._flow_id
                n._flow_from=node._flow_from
                n._flow_prop=node._flow_prop
                r.FlowNode[n._flow_id]=n
                if(n.type=="Expression"){
                    // console.log('var',n)
                    n._flow_id=node._flow_id;
                    _doBody(n,file)
                }else if(r.FlowFilter[n._flow_id]&&(n.type=="NewExpression"||n.type=="CallExpression")){
                    if(n.type=="NewExpression"){
                        r.UMLClass[cls.value][n._flow_id]=n;
                        n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6,text:`${n.value}`}
                    }else{
                        n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6+gD3fontSize*2,text:`${n.value}()`}
                    }
                    r.Flow+=n._flow_str;    
                }
            }
        }
    }

    function traverseMethod(member,cls,file,symbol){
        var method=cls.value?member.value+'_'+cls.value:member.value
        r.FlowOne[member.value]=method//todo 处理不同类同名方法
        member._flow_id=method
        member._flow_from=cls.value
        member._file=file
        if(r.FlowFilter[member._flow_id]===false)return;
        r.FlowNode[member._flow_id]=member;
        r.FDPNode[member._flow_id]={id:member._flow_id,w:member.value.length*gD3fontSize/1.6+gD3fontSize*3,text:`${symbol||':'}${member.value}()`}
        if(symbol)r.UML+=`    ${symbol}${member.value}()\n`
        if(member.base||member.value==cls.value){//constructor
            r.Flow+=`    ${member._flow_id}(${member.value})\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
        }else{
            r.Flow+=`    ${member._flow_id}([${member.value}])\nclick ${member._flow_id} "javascript:void(onFlowClick('${member._flow_id}','${file}'))"\n`
        }
        if(cls.value){
            r.FlowLink+=`${cls.value} --o ${member._flow_id}\n`
            r.FDPLinks.push({source:cls.value,target:member._flow_id,value:2})
        }
        if(r.showCall)_doBody(member,file)    
        function _doBody(node,file){
            if(!node.body)return
            for(let n of node.body ){
                n._file=file
                n._flow_id=n.value+'_'+node._flow_id
                n._flow_from=r.showIf?node._flow_id:method
                r.FlowNode[n._flow_id]=n
                if(n.type=="IfStatement"||n.type=="LoopStatement"){//can't show condition CallExpression
                    if(r.showIf){
                        r.Flow+=n.type=="IfStatement"?`        ${n._flow_id}{${n.value}}\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`:`        ${n._flow_id}((${n.value}))\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:0,text:n.type=="IfStatement"?'🔷':'🔵'}
                    }  
                    if(n.condition&&n.condition.value)n._flow_condition='|'+n.condition.value.replaceAll('|','｜').replaceAll('[','⌈').replaceAll(']','⌋')+'|'
                    _doBody(n,file)
                }else if(r.FlowFilter[n._flow_id]&&(n.type=="NewExpression"||n.type=="CallExpression")){
                    if(n.type=="NewExpression"){
                        if(cls.value)r.UMLClass[cls.value][n._flow_id]=n;
                        n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6,text:n.value}
                    }else{
                        n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6+gD3fontSize*2,text:n.value+'()'}
                    }
                    r.Flow+=n._flow_str;    
                }else if(n.type=="Expression"){
                    n._flow_id=node._flow_id;
                    _doBody(n,file)
                }else if(n.type=='Variable'){
                    n._flow_id=node._flow_id;//not a flow node same as condition
                    if(!r.showMethod)traverseVariable(n,file)
                    else{_doBody(n,file)}
                }
            }
        }
    }

    function traverseVariable(variable,file){
        if(r.showMethod)return
        // console.log('traverse var',variable)
        _doBody(variable,file)
        function _doBody(node,file){
            if(!node.body)return
            for(let n of node.body){
                n._file=file
                n._flow_id=n.value+'_'+node._flow_id
                n._flow_from=node._flow_id
                if(r.FlowNode[n._flow_id])continue
                r.FlowNode[n._flow_id]=n
                if(r.FlowFilter[n._flow_id]&&(n.type=="NewExpression"||n.type=="CallExpression")){
                    if(n.type=="NewExpression"){
                        n._flow_str=`        ${n._flow_id}[${n.value}]\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6,text:n.value}
                    }else{
                        n._flow_str=`        ${n._flow_id}([${n.value}])\nclick ${n._flow_id} "javascript:void(onFlowClick('${n._flow_id}','${file}'))"\n`
                        r.FDPNode[n._flow_id]={id:n._flow_id,w:n.value.length*gD3fontSize/1.6+gD3fontSize*2,text:n.value+'()'}
                    }
                    r.Flow+=n._flow_str;    
                }else if(n.type=="Expression"){
                    n._flow_id=node._flow_id
                    _doBody(n,file)
                }
            }
        }
    }
}


var gD3 = {tree: {},options:{
    all:false,
    num:false,
    kw:false,
    id:false,
    str:false,
    punc:false,
    sp:false,
    op:false,
    Comment:false,
    ClassDefine:true,
    InterfaceDefine:true,
    NamespaceDefine:true,
    MethodDefine:true,
    PropertyDefine:true,
    Variable:true,
    NewExpression:true,
    CallExpression:true,
    FunctionDefine:true,
    LoopStatement:true,
    IfStatement:true,
    Expression:false,
    BlockStatement:false,
    // Condition:false,
    Arguments:false,
    Arg:false,
}}
var gD3Scale=1
function scaleD3(){
    gMermaidScale++;
    document.getElementById("D3Diagram").style.width=`${100*gMermaidScale}%`
}
var gD3fontSize=14
function fontSizeD3Minus(v){
    gD3fontSize=gD3fontSize-v
}
function fontSizeD3Plus(v){
    gD3fontSize=gD3fontSize+v
}
function renderD3Option(){
    var html=''
    for(let op in gD3.options){
        html+=`<input type="checkbox" id="d3op_${op}" class="d3ops" ${gD3.options[op]?"checked":''} /><label for="d3op_${op}">${op}</label> `
    }
    document.getElementById("D3Option").innerHTML=html
}
renderD3Option()
function getD3Option(){
    for(let op in gD3.options){
        gD3.options[op]=document.getElementById('d3op_'+op).checked
    }
}
function clearD3(){
    document.getElementById('D3Diagram').innerHTML='';
}

function genD3(){
    var r={name:'file',children:[]}
    var level_symbol={
        'public':'+',
        "private":'-',
        "protected":'#',
        "internal":'~',
        "static":'$',
    }
    getD3Option()
    console.log('D3 options',gD3.options)

    for(let file in gAst){
        let d3node=JSON.parse(JSON.stringify(gAst[file]))
        SCAST.traverseAst(d3node,function(node){
            node.children=[]
            if(node.body&&node.body.length>0){
                for(let b of node.body){
                    if(gD3.options[b.type]||gD3.options.all){
                        node.children.push(b)
                    }
                }
            }
            switch(node.type){
                case 'top':
                    node.name=file+'.file'
                    node.value=file
                    break;
                case 'ClassDefine':
                    node.name=`[ ${node.value} ]`
                    break;
                case 'InterfaceDefine':
                    node.name=`( ${node.value} )`
                    break;
                case 'MethodDefine':
                    if(node.level&&level_symbol[node.level]){
                        node.name=`${level_symbol[node.level]}${node.value}()`
                    }else{
                        node.name=`:${node.value}()`
                    }
                    break;
                case 'FunctionDefine':
                    node.name=`:${node.value}()`
                    break;
                case 'PropertyDefine':
                    if(node.level&&level_symbol[node.level]){
                        node.name=`${level_symbol[node.level]}${node.value}`
                    }else{
                        node.name=`${node.value}`
                    }
                    break;
                case 'NamespaceDefine':
                    node.name=node.value+'.namespace'
                    break;
                case 'NewExpression':
                    node.name='( '+node.value+' )'
                    break;
                case 'CallExpression':
                    node.name=node.value+'()'
                    break;
                case 'IfStatement':
                    node.name=node.value;
                    break;
                case 'LoopStatement':
                    node.name=node.value;
                    break;
                default:
                    node.name=node.value
            }
        })
        r.children.push(d3node)
    }
    gD3.tree=r;
    var D3Select=document.getElementById('D3Select').value;
    gD3.select=D3Select;
    console.log('gD3',gD3)
    renderD3(D3Select,gD3.tree)
}

function renderD3(type,data){
    var svgnode=D3M[type](data)
    document.getElementById('D3Diagram').append(svgnode)
}
function saveD3(){//svg not work
    var svgnode=D3M[gD3.select](gD3.tree)
    _saveFile(svgnode.outerHTML,'StaticCodeAnalysis_'+gD3.select+'.svg')

}