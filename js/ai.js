gOllamaHost="http://127.0.0.1:11434"
gModel=""
gNumCtx=16000
gLanguage="zh"

var PROMPT_ZH=`
你是一个经验丰富的程序员，你的任务是解读以下代码，总结类和方法的作用，并将结果储存到对应的id的value字段中。
类的总结中除了类的作用外，还需包含类中重要的公开字段和其作用，如有继承自其他类也请说明。
方法的总结中除了方法的作用外，还需告诉我传入参数所代表的意义，如果有返回值请告诉我返回值的意义。
以下是一个示例：
--------
${'```'}
class Animal {
    public name:string;
    constructor(name:string) {
       this.name = name;
    }
    public sound() {
        // print animal sound
    }
}
class Dog extends Animal {
    constructor(name:string){
        super(name);
    }
    public sound(){
        console.log("Woof!");
        return new Sound("Woof!");
    }
}
${'```'}
class name:Animal id:_Animal
class name:Dog id:_Animal_Dog
function name:sound id:_Animal_sound
function name:sound id:_Animal_Dog_sound
function name:constructor id:_Animal_constructor
function name:constructor id:_Animal_Dog_constructor

返回的json如下
{
    "_Animal":"这是一个代表动物的基类，包含有一个name字段用于储存动物的名字。",
    "_Animal_sound":"用于打印动物叫声，需在子类中实现。",
    "_Animal_Dog":"一个派生类，表示狗这种动物。",
    "_Animal_Dog_sound":"发出狗的声音。具体实现为打印 Woof!并返回了一个Sound对象。",
    "_Animal_constructor":"这是Animal类的构造函数，传入一个name字符串代表动物名字。并设定name字段。",
    "_Animal_Dog_constructor":"这是Dog类的构造函数，传入一个字符串并调用父类构造函数设定name字段。"
}
---------

需要解读的代码如下:
`

var PROMPT_EN=`
You are an experienced programmer. Your task is to interpret the following code, summarize the purpose of the classes and methods, and store the results in the corresponding id's value field.
In the summary of each class, include not only its purpose but also any important public fields and their purposes. If the class inherits from another class, please note it.
In the summary of each method, include not only its purpose but also the meaning of the input parameters, as well as the significance of any return values if applicable.
Here is an example:
--------
${'```'}
class Animal {
    public name:string;
    constructor(name:string) {
       this.name = name;
    }
    public sound() {
        // print animal sound
    }
}
class Dog extends Animal {
    constructor(name:string){
        super(name);
    }
    public sound(){
        console.log("Woof!");
        return new Sound("Woof!");
    }
}
${'```'}
class name:Animal id:_Animal
class name:Dog id:_Animal_Dog
function name:sound id:_Animal_sound
function name:sound id:_Animal_Dog_sound
function name:constructor id:_Animal_constructor
function name:constructor id:_Animal_Dog_constructor

return json like this:
{
    "_Animal":"This is a base class representing an animal, which contains a name field to store the animal's name.",
    "_Animal_sound":"To print an animal's sound, this needs to be implemented in the subclass.",
    "_Animal_Dog":"A class representing a dog.",
    "_Animal_Dog_sound":"Output the dog's sound. The implementation prints "Woof!" and returns a Sound object.",
    "_Animal_constructor":This is the constructor of the Animal class, which takes a name string to represent the animal's name and sets the name field.",
    "_Animal_Dog_constructor":"This is the constructor of the Dog class, which takes a string and calls the parent class constructor to set the name field."
}
---------

Here is user's code you need analyse:
`

async function aiAnalysis(){
    var j=getOutlineJson()
    for(let file in gAst){
        let p=getOutlinePrompt(j[file],gAst[file].code)
        await outlineAgent(p,j[file],file)
    }
    // loadAstJson(JSON.stringify(gAst))
}

function getOutlineJson(){
    var result={}//{file:{cls:{value:_flow_id},func:{}}}
    if(gMermaid){
        for(let k in gMermaid.FlowNode){
            let node=gMermaid.FlowNode[k]
            let nodev=node.value||node._value
            if(!result[node._file])result[node._file]={'cls':{},'func':{}}
            if(node.type=="ClassDeclaration"||node.type=="ClassDefine"||node.type=="InterfaceDefine")result[node._file].cls[nodev]=node._flow_id||nodev;
            if(node.type=="FunctionExpression"||node.type=="MethodDefine"||node.type=="FunctionDeclaration"||node.type=="FunctionDefine")result[node._file].func[nodev]=node._flow_id||nodev;
        }
        console.log('outline json',result)
    }
    return result
}
function getOutlinePrompt(json,code){
    var result=''
    for(let cls in json.cls){
        result+=`class name:${cls} id:${json.cls[cls]}\n`
    }
    for(let func in json.func){
        result+=`function name:${func} id:${json.func[func]}\n`
    }
    var prompt=gLanguage=='zh'?PROMPT_ZH:PROMPT_EN;
    prompt+=`${'```'}
    ${code}
    ${'```'}
    
    ${result}`
// console.log(prompt)
return prompt
}

function outlineAgent(prompt,json,file){
    var fmt={
        "type": "object",
        "properties": {
        },
        "required": [
        ]
    }
    for(let cls in json.cls){
        fmt.properties[json.cls[cls]]={"type":"string"}
        fmt.required.push(json.cls[cls])
    }
    for(let func in json.func){
        fmt.properties[json.func[func]]={"type":"string"}
        fmt.required.push(json.func[func])
    }
    var query={
        'stream':false,
        'model':gModel,
        'messages':[
            {
                'role':'system',
                'content':prompt,
            }
        ],
        'format':fmt,
        'options':{
            "num_ctx":gNumCtx
        }
    }
    document.getElementById('aibtn').innerHTML='⌛'
    document.getElementById('aibtn').disabled=true
    return fetch(gOllamaHost+'/api/chat',{method:"POST",headers: {
        'Content-Type': 'application/json'
    },body: JSON.stringify(query)}).then(response=>{return response.json()}).then(resp=>{
        var result = JSON.parse(resp.data?.message?.content || resp.message?.content)
        console.log('outlineAgent',resp,result)
        for(let fid in result){
            gMermaid.FlowNode[fid]['_analysis']=result[fid]
        }
        renderMermaidFilter()
        gAst[file].ai=result
        wtfmsg("analysis by ollama AI ok, hover on outline label or click icon show result.")
        document.getElementById('aibtn').innerHTML='🦙'
        document.getElementById('aibtn').disabled=false
        return false
    }).catch(err=>{
        wtfmsg('analysis by ollama AI fail.')
        console.warn('analysis by ollama AI fail.')
        document.getElementById('aibtn').innerHTML='🦙'
        document.getElementById('aibtn').disabled=false
        return false
    })
}

function getModels(){
    fetch(gOllamaHost+'/api/tags',{method:"GET",headers: {
        'Content-Type': 'application/json'
    }}).then(response=>{return response.json()}).then(resp=>{
        console.log('get models',resp)
        var models=resp.models||resp.data.models
        let result = ''
        for (let model of models) {
            result += `<option value="${model.name}">${model.name}</option>`
        }
        document.getElementById('ai_models').innerHTML = result
        document.getElementById('aibtn').style.display='inline'
        gModel=models[0].name
        return false
    }).catch(err=>{
        wtfmsg('Ollama get models fail.')
        console.warn('Ollama get models fail')
        return false
    })
}

function onModelChange(){
    gModel=document.getElementById('ai_models').value
    console.log('model change',gModel)
}
function onNumCtxChange(){
    gNumCtx=parseInt(document.getElementById('ai_numctx').value)
    console.log('numctx change',gNumCtx)
}
function onLanguageChange(){
    gLanguage=document.getElementById('ai_language').value
    console.log('language change',gLanguage)
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


