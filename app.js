const STORAGE_KEY='douban-ao3-project-v1';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validUrl=v=>/^https?:\/\//i.test(v||'');
const defaults=()=>{const a=uid(),b=uid();return {version:1,users:[{id:a,name:'虚构飞鸟',tag:'组长',avatar:''},{id:b,name:'路过的橘子',tag:'',avatar:''}],post:{authorId:a,time:'2026-09-11 00:40',title:'这是一个测试',blocks:[{id:uid(),type:'text',content:'今天发生了一件很奇怪的事情。\n\n然后事情开始变得越来越离谱。'}],antiRepost:true,showNav:true,countMode:'auto',manualCount:326},comments:[{id:uid(),authorId:b,time:'59秒前',content:'我觉得不对。',isOP:false,quoteTarget:null}]}};
let state=loadState()||defaults();let saveTimer;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return x&&x.users&&x.post&&x.comments?x:null}catch{return null}}
function normalize(){if(!state.users.length)state.users.push({id:uid(),name:'新用户',tag:'',avatar:''});if(!state.users.some(u=>u.id===state.post.authorId))state.post.authorId=state.users[0].id;state.comments.forEach(c=>{if(!state.users.some(u=>u.id===c.authorId))c.authorId=state.users[0].id;if(c.quoteTarget&&c.quoteTarget!=='post'&&!state.comments.some(x=>x.id===c.quoteTarget))c.quoteTarget=null})}
function commit(){normalize();clearTimeout(saveTimer);$('#saveState').textContent='保存中…';saveTimer=setTimeout(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$('#saveState').textContent='已自动保存'},250);renderPreview();updateExports()}
function user(id){return state.users.find(u=>u.id===id)||state.users[0]}
function userOptions(selected){return state.users.map(u=>`<option value="${u.id}" ${u.id===selected?'selected':''}>${esc(u.name||'未命名用户')}</option>`).join('')}
function avatarHTML(u,cls='db-avatar'){return validUrl(u?.avatar)?`<img class="${cls}" src="${esc(u.avatar)}" alt="${esc(u.name)}头像">`:`<span class="${cls} db-avatar-placeholder">${esc((u?.name||'?')[0])}</span>`}
function textHTML(text){return esc(text).split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('')}

function renderAll(){normalize();bindStatic();renderUsers();renderPost();renderComments();commit()}
function bindStatic(){
  $('#postTime').value=state.post.time;$('#postTitle').value=state.post.title;$('#antiRepost').checked=state.post.antiRepost;$('#showNav').checked=state.post.showNav;$('#manualCount').value=state.post.manualCount;$('#manualCount').disabled=state.post.countMode!=='manual';
  $$('[name=countMode]').forEach(x=>x.checked=x.value===state.post.countMode);
}
function renderPost(){const p=state.post;$('#postAuthor').innerHTML=userOptions(p.authorId);$('#blocksEditor').innerHTML=p.blocks.map((b,i)=>`<article class="block-card" data-block="${b.id}"><div class="block-top"><span class="block-kind">${b.type==='text'?'文字':'图片'} · ${i+1}</span><div class="mini-actions"><button data-act="up" title="上移">↑</button><button data-act="down" title="下移">↓</button><button data-act="remove" class="danger" title="删除">删除</button></div></div>${b.type==='text'?`<textarea data-field="content" placeholder="输入正文…">${esc(b.content)}</textarea>`:`<input data-field="content" type="url" value="${esc(b.content)}" placeholder="https://example.com/image.jpg">${validUrl(b.content)?`<img class="image-preview" src="${esc(b.content)}" alt="图片预览">`:'<div class="image-placeholder">输入图床 URL 后显示预览</div>'}`}</article>`).join('')||'<div class="image-placeholder">正文为空，请添加文字或图片</div>'}
function renderUsers(){ $('#userCountBadge').textContent=state.users.length;$('#usersEditor').innerHTML=state.users.map((u,i)=>`<article class="user-card" data-user="${u.id}">${validUrl(u.avatar)?`<img class="avatar-edit" src="${esc(u.avatar)}" alt="">`:`<span class="avatar-edit broken-avatar" data-letter="${esc((u.name||'?')[0])}"></span>`}<div class="user-fields"><label>用户名<input data-field="name" type="text" value="${esc(u.name)}"></label><label>用户标签<input data-field="tag" type="text" value="${esc(u.tag)}" placeholder="可留空"></label><label class="wide">头像图床 URL<input data-field="avatar" type="url" value="${esc(u.avatar)}" placeholder="https://example.com/avatar.jpg"></label></div><button class="delete-user" data-delete-user title="删除用户" ${state.users.length===1?'disabled':''}>删除</button></article>`).join('');$('#postAuthor').innerHTML=userOptions(state.post.authorId)}
function quoteOptions(comment){let out=`<option value="post" ${comment.quoteTarget==='post'?'selected':''}>主楼 · ${esc(user(state.post.authorId).name)} · ${esc((state.post.title||'无标题').slice(0,22))}</option>`;state.comments.filter(c=>c.id!==comment.id).forEach((c,i)=>{const n=state.comments.indexOf(c)+1;out+=`<option value="${c.id}" ${comment.quoteTarget===c.id?'selected':''}>回复 #${n} · ${esc(user(c.authorId).name)} · ${esc((c.content||'空内容').replace(/\n/g,' ').slice(0,24))}</option>`});return out}
function renderComments(){ $('#commentCount').textContent=state.comments.length;$('#commentsEditor').innerHTML=state.comments.map((c,i)=>`<article class="comment-card" data-comment="${c.id}"><div class="card-top"><h3>回复 <span class="comment-number">#${i+1}</span></h3><div class="mini-actions"><button data-act="up">↑</button><button data-act="down">↓</button><button data-act="copy">复制</button><button data-act="remove" class="danger">删除</button></div></div><div class="form-grid two"><label>发言用户<select data-field="authorId">${userOptions(c.authorId)}</select></label><label>时间<input data-field="time" type="text" value="${esc(c.time)}" placeholder="53秒前"></label></div><label class="check"><input data-field="isOP" type="checkbox" ${c.isOP?'checked':''}><span>标记为楼主</span></label><label>正文<textarea data-field="content" placeholder="输入回复内容…">${esc(c.content)}</textarea></label><div class="quote-controls"><label class="check"><input data-field="hasQuote" type="checkbox" ${c.quoteTarget?'checked':''}><span>引用其他内容</span></label>${c.quoteTarget?`<label>引用对象<select data-field="quoteTarget">${quoteOptions(c)}</select></label>`:''}</div></article>`).join('')||'<div class="image-placeholder">还没有回复</div>'}

function getQuote(target){if(target==='post'){const qu=user(state.post.authorId);return {name:qu.name,tag:qu.tag,isOP:true,text:[state.post.title,...state.post.blocks.filter(b=>b.type==='text').map(b=>b.content)].filter(Boolean).join(' — ')}}const c=state.comments.find(x=>x.id===target);if(!c)return null;const qu=user(c.authorId);return {name:qu.name,tag:qu.tag,isOP:c.isOP,text:c.content}}
function renderPreview(){const p=state.post,u=user(p.authorId),count=p.countMode==='manual'?Number(p.manualCount||0):state.comments.length;$('#preview').innerHTML=`<div class="douban"><div class="db-topbar"><span class="db-back">‹</span><span class="db-more">•••</span></div><div class="db-post"><div class="db-author">${avatarHTML(u)}<div class="db-author-info"><span class="db-name">${esc(u.name)}</span>${u.tag?`<span class="db-tag">${esc(u.tag)}</span>`:''}<span class="db-time">${esc(p.time)}</span></div></div><h1 class="db-title">${esc(p.title||'未命名帖子')}</h1><div class="db-body">${p.blocks.map(b=>b.type==='text'?textHTML(b.content):(validUrl(b.content)?`<img src="${esc(b.content)}" alt="正文图片">`:'')).join('')}</div>${p.antiRepost?'<div class="db-anti"><span class="db-help">?</span> 该小组已开启防搬运功能</div>':''}</div>${p.showNav?`<div class="db-nav"><span class="active">回复 ${count}</span><span>赞</span><span>转发</span><span>收藏</span><span>礼物</span></div>`:''}<div class="db-comments"><div class="db-comments-head"><strong>全部回复</strong><span>楼主</span></div>${state.comments.map(c=>{const cu=user(c.authorId),q=getQuote(c.quoteTarget);return `<div class="db-comment">${avatarHTML(cu)}<div class="db-comment-main"><div class="db-comment-head"><span class="db-name">${esc(cu.name)}</span>${c.isOP?'<span class="db-op">楼主</span>':''}${cu.tag?`<span class="db-tag">${esc(cu.tag)}</span>`:''}<span class="db-time">${esc(c.time)}</span></div>${q?`<div class="db-quote"><strong>${esc(q.name)}</strong>${q.isOP?'<span class="db-op">楼主</span>':''}${q.tag?`<span class="db-tag">${esc(q.tag)}</span>`:''}<span class="db-quote-colon">：</span><span>${esc(q.text)}</span></div>`:''}<div class="db-comment-text">${esc(c.content).replace(/\n/g,'<br>')}</div></div></div>`}).join('')||'<div class="db-empty">还没有回复</div>'}<div class="db-end"><span>THE END</span></div></div></div>`}

const AO3_CSS=`#workskin .douban { width: 100%; max-width: 430px; margin: 0 auto; background: #fff; color: #333; font-family: Arial, "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 15px; line-height: 1.65; }
#workskin .db-topbar { height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 17px; color: #333; border-bottom: 1px solid #f0f0f0; }
#workskin .db-back { font-size: 27px; font-weight: 300; line-height: 1; }
#workskin .db-more { font-size: 22px; letter-spacing: 3px; }
#workskin .db-post { padding: 19px 18px 0; }
#workskin .db-author { display: flex; align-items: center; }
#workskin .db-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: #e9eeeb; flex: none; }
#workskin .db-avatar-placeholder { display: flex; align-items: center; justify-content: center; color: #fff; background: #80ab9b; font-weight: 700; }
#workskin .db-author-info { min-width: 0; margin-left: 10px; line-height: 1.35; }
#workskin .db-name { font-size: 15px; font-weight: 600; color: #337b65; }
#workskin .db-tag, #workskin .db-op { font-size: 11px; border-radius: 3px; padding: 2px 5px; margin-left: 5px; font-weight: 400; }
#workskin .db-tag { background: #eff3f0; color: #849089; }
#workskin .db-op { background: #e6f4ef; color: #168360; }
#workskin .db-time { display: block; color: #a5aaa7; font-size: 11px; margin-top: 3px; }
#workskin .db-title { font-size: 20px; line-height: 1.4; margin: 19px 0 14px; font-weight: 700; color: #222; }
#workskin .db-body p { margin: 0 0 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
#workskin .db-body img { display: block; width: 100%; height: auto; margin: 14px 0; border-radius: 2px; }
#workskin .db-anti { margin: 18px 0; padding: 10px 12px; background: #f7f7f7; color: #999; font-size: 11px; border-radius: 2px; }
#workskin .db-nav { display: flex; justify-content: space-between; border-top: 1px solid #f0f0f0; margin: 18px -18px 0; padding: 13px 18px; color: #8e9590; font-size: 12px; }
#workskin .db-comments { border-top: 8px solid #f5f5f5; }
#workskin .db-comment { display: flex; padding: 18px; border-bottom: 1px solid #f0f0f0; }
#workskin .db-comment-main { flex: 1; min-width: 0; margin-left: 10px; }
#workskin .db-comment-head { line-height: 1.25; }
#workskin .db-comment-text { margin-top: 10px; color: #333; white-space: pre-wrap; overflow-wrap: anywhere; }
#workskin .db-quote { background: #f5f6f5; border-left: 3px solid #d5dbd7; padding: 9px 11px; margin: 10px 0; color: #686f6a; font-size: 13px; }
#workskin .db-quote strong { display: block; color: #477563; margin-bottom: 2px; font-weight: 600; }
#workskin .db-end { text-align: center; padding: 30px 0 42px; color: #a2aaa5; font-size: 11px; letter-spacing: .2em; }
#workskin .douban { font-size: 16px; line-height: 1.55; color: #171817; }
#workskin .db-topbar { height: 64px; padding: 0 20px; border-bottom: 0; }
#workskin .db-back { font-size: 42px; font-family: Arial, sans-serif; font-weight: 200; line-height: 1; }
#workskin .db-more { font-size: 17px; letter-spacing: 4px; font-weight: 900; }
#workskin .db-post { padding: 24px 20px 0; }
#workskin .db-avatar { width: 44px; height: 44px; }
#workskin .db-author-info { margin-left: 11px; }
#workskin .db-name { font-size: 16px; color: #151715; font-weight: 650; }
#workskin .db-tag { font-size: 13px; line-height: 1.45; background: #06be46; color: #fff; border-radius: 4px; padding: 1px 5px; font-weight: 700; }
#workskin .db-op { font-size: 12px; line-height: 1.45; background: #f2f3f2; color: #666; border-radius: 4px; padding: 2px 5px; font-weight: 650; }
#workskin .db-time { font-size: 13px; color: #aaaead; margin-top: 4px; }
#workskin .db-title { font-size: 25px; line-height: 1.3; margin: 28px 0 27px; font-weight: 800; color: #101110; }
#workskin .db-body { min-height: 180px; }
#workskin .db-body p { font-size: 17px; font-weight: 400; line-height: 1.7; margin: 0 0 20px; }
#workskin .db-body img { margin: 20px 0; }
#workskin .db-anti { border-top: 1px solid #eee; margin: 32px 0 0; padding: 18px 0 25px; background: transparent; color: #a8abaa; font-size: 13px; border-radius: 0; }
#workskin .db-help { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border: 1px solid #a8abaa; border-radius: 50%; font-size: 11px; margin-right: 3px; }
#workskin .db-nav { position: relative; margin: 0; border-top: 9px solid #f4f4f4; border-bottom: 1px solid #ededed; padding: 17px 20px 13px; background: #fff; color: #777b79; font-size: 16px; font-weight: 650; }
#workskin .db-nav span { position: relative; text-align: center; }
#workskin .db-nav .active { color: #171817; font-weight: 800; }
#workskin .db-nav .active:after { content: ""; position: absolute; left: 50%; bottom: -14px; width: 29px; height: 4px; border-radius: 4px; background: #171817; transform: translateX(-50%); }
#workskin .db-comments { border-top: 0; }
#workskin .db-comments-head { display: flex; align-items: center; justify-content: space-between; padding: 17px 20px 9px; font-size: 17px; }
#workskin .db-comments-head strong { font-weight: 800; }
#workskin .db-comments-head span { background: #f6f6f6; border-radius: 9px; padding: 8px 12px; font-weight: 700; }
#workskin .db-comment { padding: 17px 20px; border-bottom: 0; align-items: flex-start; }
#workskin .db-comment .db-avatar { width: 39px; height: 39px; }
#workskin .db-comment-main { margin-left: 10px; }
#workskin .db-comment-head { position: relative; display: flex; align-items: center; min-height: 24px; white-space: nowrap; }
#workskin .db-comment-head .db-name { color: #8d918f; font-size: 15px; margin-right: 4px; }
#workskin .db-comment-head .db-tag, #workskin .db-comment-head .db-op { margin-left: 0; margin-right: 4px; }
#workskin .db-comment-head .db-time { display: inline; margin: 0; color: #b4b7b5; font-size: 13px; overflow: hidden; text-overflow: ellipsis; }
#workskin .db-comment-text { margin-top: 5px; font-size: 17px; line-height: 1.7; font-weight: 400; color: #131513; }
#workskin .db-quote { display: flex; align-items: center; min-width: 0; background: #f6f6f6; border-left: 0; border-radius: 8px; padding: 9px 11px; margin: 8px 0 11px; color: #696d6b; font-size: 14px; white-space: nowrap; overflow: hidden; }
#workskin .db-quote strong { display: inline; color: #4d504e; margin: 0 4px 0 0; font-weight: 650; flex: none; }
#workskin .db-quote .db-tag, #workskin .db-quote .db-op { margin-left: 0; margin-right: 4px; flex: none; }
#workskin .db-quote > span:last-child { overflow: hidden; text-overflow: ellipsis; }
#workskin .db-end { background: #f5f5f5; margin-top: 16px; padding: 28px 0 36px; color: #ced0cf; font-size: 11px; letter-spacing: .28em; }
#workskin .db-end span:before, #workskin .db-end span:after { content: ""; display: inline-block; width: 42px; border-top: 1px solid #d8dad9; vertical-align: middle; margin: 0 13px; }`;
function buildHTML(){return $('#preview').innerHTML.trim()}
function updateExports(){if($('#htmlOutput'))$('#htmlOutput').value=buildHTML();if($('#cssOutput'))$('#cssOutput').value=AO3_CSS}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}

document.addEventListener('input',e=>{
  const t=e.target;if(t.id==='postTime')state.post.time=t.value;else if(t.id==='postTitle')state.post.title=t.value;else if(t.id==='manualCount')state.post.manualCount=Math.max(0,Number(t.value));
  else if(t.closest('[data-block]')){const b=state.post.blocks.find(x=>x.id===t.closest('[data-block]').dataset.block);if(b)b[t.dataset.field]=t.value}
  else if(t.closest('[data-user]')){const u=state.users.find(x=>x.id===t.closest('[data-user]').dataset.user);if(u)u[t.dataset.field]=t.value}
  else if(t.closest('[data-comment]')){const c=state.comments.find(x=>x.id===t.closest('[data-comment]').dataset.comment);if(c&&t.dataset.field==='content')c.content=t.value}
  commit();
});
document.addEventListener('change',e=>{
  const t=e.target;if(t.id==='postAuthor')state.post.authorId=t.value;else if(t.id==='antiRepost')state.post.antiRepost=t.checked;else if(t.id==='showNav')state.post.showNav=t.checked;else if(t.name==='countMode'){state.post.countMode=t.value;$('#manualCount').disabled=t.value!=='manual'}
  else if(t.closest('[data-comment]')){const c=state.comments.find(x=>x.id===t.closest('[data-comment]').dataset.comment);if(c){if(t.dataset.field==='isOP')c.isOP=t.checked;else if(t.dataset.field==='hasQuote'){c.quoteTarget=t.checked?(state.comments.find(x=>x.id!==c.id)?.id||'post'):null;renderComments()}else c[t.dataset.field]=t.value}}
  if(t.closest('[data-user]')){renderUsers();renderPost();renderComments()}
  if(t.closest('[data-block]')&&t.dataset.field==='content')renderPost();
  commit();
});
document.addEventListener('click',async e=>{
  const tab=e.target.closest('[data-tab], [data-tab-target]');if(tab){const n=tab.dataset.tab||tab.dataset.tabTarget;$$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===n));$$('.panel').forEach(x=>x.classList.toggle('active',x.id===`panel-${n}`));if(n==='export')updateExports();return}
  if(e.target.id==='addTextBlock'){state.post.blocks.push({id:uid(),type:'text',content:''});renderPost();commit()}
  if(e.target.id==='addImageBlock'){state.post.blocks.push({id:uid(),type:'image',content:''});renderPost();commit()}
  if(e.target.id==='addUser'){state.users.push({id:uid(),name:`新用户 ${state.users.length+1}`,tag:'',avatar:''});renderUsers();renderPost();renderComments();commit()}
  if(e.target.matches('[data-delete-user]')){const id=e.target.closest('[data-user]').dataset.user;if(state.users.length>1&&confirm('确定删除这个用户吗？使用该用户的内容将切换到第一个用户。')){state.users=state.users.filter(x=>x.id!==id);normalize();renderUsers();renderPost();renderComments();commit()}}
  if(e.target.id==='addComment'||e.target.id==='addCommentBottom'){state.comments.push({id:uid(),authorId:state.users[0].id,time:'刚刚',content:'',isOP:false,quoteTarget:null});renderComments();commit();setTimeout(()=>$('#commentsEditor').lastElementChild?.scrollIntoView({behavior:'smooth',block:'center'}),0)}
  const card=e.target.closest('[data-block], [data-comment]');if(card&&e.target.dataset.act){const isBlock=card.hasAttribute('data-block'),arr=isBlock?state.post.blocks:state.comments,id=card.dataset[isBlock?'block':'comment'],i=arr.findIndex(x=>x.id===id),act=e.target.dataset.act;if(act==='up'&&i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]];if(act==='down'&&i<arr.length-1)[arr[i+1],arr[i]]=[arr[i],arr[i+1]];if(act==='remove')arr.splice(i,1);if(act==='copy'&&!isBlock)arr.splice(i+1,0,{...arr[i],id:uid()});isBlock?renderPost():renderComments();commit()}
  const copy=e.target.closest('[data-copy]');if(copy){const val=copy.dataset.copy==='html'?$('#htmlOutput').value:$('#cssOutput').value;try{await navigator.clipboard.writeText(val);toast('已复制到剪贴板')}catch{$(copy.dataset.copy==='html'?'#htmlOutput':'#cssOutput').select();document.execCommand('copy');toast('已复制到剪贴板')}}
  if(e.target.id==='saveProject'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='douban-project.json';a.click();URL.revokeObjectURL(a.href);toast('项目文件已保存')}
  if(e.target.id==='openProject')$('#projectFile').click();
  if(e.target.id==='resetProject'&&confirm('新建项目会清空当前内容，建议先保存项目文件。是否继续？')){state=defaults();renderAll();toast('已新建项目')}
});
$('#projectFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.users||!x.post||!Array.isArray(x.comments))throw 0;state=x;renderAll();toast('项目已打开')}catch{alert('无法打开：这不是有效的项目文件。')}e.target.value=''})

function registerWebMCP(){const ctx=document.modelContext;if(!ctx?.registerTool)return;const reg=(tool)=>{try{Promise.resolve(ctx.registerTool(tool)).catch(()=>{})}catch{}};reg({name:'get_douban_project',title:'读取当前豆瓣项目',description:'读取编辑器当前项目数据。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>JSON.parse(JSON.stringify(state))});reg({name:'add_douban_comment',title:'添加豆瓣回复',description:'为当前帖子添加一条回复并刷新预览。',inputSchema:{type:'object',properties:{authorId:{type:'string'},time:{type:'string'},content:{type:'string'},isOP:{type:'boolean'}},required:['authorId','content'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:i=>{if(!state.users.some(u=>u.id===i.authorId))throw new Error('未知用户');const c={id:uid(),authorId:i.authorId,time:i.time||'刚刚',content:i.content,isOP:!!i.isOP,quoteTarget:null};state.comments.push(c);renderComments();commit();return {id:c.id,commentCount:state.comments.length}}})}
renderAll();registerWebMCP();
