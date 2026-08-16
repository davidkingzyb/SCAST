var rootUl = null;
var repo_auth = ''
var gRepoPathCode={}

function getRepoAuth() {
    repo_auth = localStorage.getItem('SCAST_repo_auth') || ''
    console.log('repo auth', repo_auth)
    document.getElementById('repo_auth').value = repo_auth
}

function onConfigRepo() {
    var $repo_url = document.getElementById('repo_url');
    repo_auth = document.getElementById('repo_auth').value;
    var urls = $repo_url.value.split('/');
    var url = `${urls.slice(0, -2).join('/')}/api/v1/repos/${urls.slice(-2).join('/')}/contents`
    console.log('repo contents url', url)
    fetch(url, {
        headers: {
            'Authorization': repo_auth
        }
    }).then(function (res) {
        if (!res.ok) {
            throw new Error("HTTP " + res.status + " " + res.statusText);
        }
        return res.json();
    }).then(ls => {
        console.log('repo content resp', ls)
        localStorage.setItem('SCAST_repo_auth', repo_auth)
        if (ls.length > 0) {
            document.getElementById('open_file_btn').style.display = 'none'
            document.getElementById('repo_btn').style.display = 'inline';

            rootUl = document.createElement("ul");
            rootUl.className = "tree-root";
            ls.forEach(function (item) {
                rootUl.appendChild(renderNode(item));
            });
            document.getElementById('repo_tree_con').appendChild(rootUl);
            document.getElementById('outline_con').open = true
        }
    });

}

function renderNode(item) {
    var li = document.createElement("li");
    li.className = "tree-node";
    li.dataset.path = item.path || item.name;
    li.dataset.type = item.type || "file";

    var row = document.createElement("div");
    row.className = "tree-row";

    var arrow = document.createElement("span");
    arrow.className = "tree-arrow empty";

    var label = document.createElement("span");
    label.className = "tree-label " + (item.type === "dir" ? "dir" : "file");
    label.textContent = item.type === "dir" ? item.name + "/" : item.name;

    if (item.type === "dir") {
        row.appendChild(arrow);
        row.appendChild(label);
        row.title = item.path;
        var childUl = document.createElement("ul");
        childUl.style.display = "none";
        li.appendChild(row);
        li.appendChild(childUl);

        var loadedOnce = false;

        function toggle() {
            if (childUl.style.display === "none") {
                childUl.style.display = "";
                arrow.className = "tree-arrow expanded";
                if (!loadedOnce) {
                    loadedOnce = true;
                    arrow.className = "tree-arrow empty";
                    var loading = document.createElement("div");
                    loading.className = "tree-loading";
                    loading.textContent = "loading...";
                    childUl.appendChild(loading);
                    fetch(item.url, {
                        headers: {
                            'Authorization': repo_auth
                        }
                    }).then(function (res) {
                        if (!res.ok) {
                            throw new Error("HTTP " + res.status + " " + res.statusText);
                        }
                        return res.json();
                    }).then(function (children) {
                        childUl.textContent = "";
                        if (!Array.isArray(children) || children.length === 0) {
                            arrow.className = "tree-arrow empty";
                            return;
                        }
                        arrow.className = "tree-arrow expanded";
                        children.forEach(function (child) {
                            childUl.appendChild(renderNode(child));
                        });
                    })
                        .catch(function (err) {
                            childUl.textContent = "";
                            var errEl = document.createElement("div");
                            errEl.className = "tree-error";
                            errEl.textContent = "error: " + err.message;
                            childUl.appendChild(errEl);
                            arrow.className = "tree-arrow collapsed";
                        });
                }
            } else {
                childUl.style.display = "none";
                arrow.className = "tree-arrow collapsed";
            }
        }

        row.addEventListener("click", toggle);
    } else {
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "tree-checkbox";
        cb.title = item.path;
        cb.dataset.path = item.path || item.name;
        // li.appendChild(cb);

        row.appendChild(arrow);
        row.appendChild(cb);
        row.appendChild(label);
        row.title = item.path;
        li.appendChild(row);

        row.addEventListener("click", function () {
            showFile(item);
        });
    }

    return li;
}

function showFile(item) {
    console.log('showFile',item)
    var $repo_url = document.getElementById('repo_url');
    var urls = $repo_url.value.split('/');
    var url=`${urls.slice(0, -2).join('/')}/api/v1/repos/${urls.slice(-2).join('/')}/raw/master/${item.path}`
    fetch(url, {
        headers: {
            'Authorization': repo_auth
        }
    }).then(function (res) {
        if (!res.ok) {
            throw new Error("HTTP " + res.status + " " + res.statusText);
        }
        return res.text()
    }).then(txt=>{
        gRepoPathCode[item.path]=txt
        var t=item.name.split('.')
        var html=`<details id="detail_${t[0]}_${t[1]}" open>
                <summary onclick="scrollToView('detail_${t[0]}_${t[1]}')">${item.name}</summary>
                <pre><code class="language-${t[1]}" id="${t[0]}">${txt.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
                </details>`
        var $code=document.getElementById('code')
        $code.innerHTML=html
        hljs.highlightAll();
        hljs.initLineNumbersOnLoad();
    })
}

async function openRepos(){
    var $code=document.getElementById('code')
    var $useTreeSitter=document.getElementById('useTreeSitter')
    var html=''
    var files=rootUl
      .querySelectorAll('input[type="checkbox"].tree-checkbox:checked')

    for(let f of files){
        var path=f.dataset.path
        var filename=path.split('/').slice(-1)[0]
        let t=filename.split('.')
        console.log('open repos',filename)
        var c=gRepoPathCode[path]
        if($useTreeSitter.checked){
            gAst[filename]=await TreeSitter.getAst(c.replace(/\r\n/g,'\n'),t[0],t.slice(-1)[0])
        }else if(t[1]=='py'){
            gAst[filename]=ESTREEPY.getAst(c.replace(/\r\n/g,'\n'),t[0])
        }else if(t[1]=='js'){
            gAst[filename]=ESTREEJS.getAst(c.replace(/\r\n/g,'\n'),t[0])
        }else{
            gAst[filename]=SCAST.getAst(c.replace(/\r\n/g,'\n'),t[0])
        }
        gAst[filename]['code']=c.replace(/\r\n/g,'\n')
        gAst[filename]['filetype']=t[1]
        gAst[filename]['filename']=t[0]
        html+=`<details id="detail_${t[0]}_${t[1]}">
            <summary onclick="scrollToView('detail_${t[0]}_${t[1]}')">${filename} </summary>
            <pre><code class="language-${t[1]}" id="${t[0]}">${c.replaceAll('<','&lt;').replaceAll('>',"&gt;")}</code></pre>
            </details>`
        $code.innerHTML=html;
        hljs.highlightAll();
        hljs.initLineNumbersOnLoad();
    }
}