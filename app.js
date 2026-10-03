// SOCKET + CHAT + PDF PREVIEW V2
const socket = io();
socket.on('new_note', (note)=>{ loadNotes(); addChatSystemMsg(`New note uploaded: ${note.course_code} - ${note.title} by ${note.uploader}`); });
socket.on('attendance_updated', (data)=>{ loadAttendance(); addChatSystemMsg(`Attendance updated for ${data.course_code} on ${data.date} - ${data.list.length} students marked`); });
socket.on('new_chat', (msg)=>{ appendChat(msg); });
socket.on('typing', (name)=>{ document.getElementById('typing-indicator').innerText = `${name} is typing...`; setTimeout(()=>document.getElementById('typing-indicator').innerText='',2000); });

function appendChat(m){
  const box=document.getElementById('chat-box');
  const isMe = m.sender_name===user?.full_name;
  box.innerHTML+=`<div style="margin:6px 0;text-align:${isMe?'right':'left'}"><div style="display:inline-block;background:${isMe?'#6a5cff':'white'};color:${isMe?'white':'black'};padding:8px 12px;border-radius:16px;max-width:80%;box-shadow:0 2px 6px rgba(0,0,0,0.08)"><b style="font-size:11px;display:block">${m.sender_name} (${m.sender_role})</b>${m.message}<br><small style="font-size:10px;opacity:0.7">${m.timestamp}</small></div></div>`;
  box.scrollTop=box.scrollHeight;
}
function addChatSystemMsg(text){ appendChat({sender_name:'System',sender_role:'bot',message:text,timestamp:new Date().toLocaleTimeString()}); }
function sendChat(){
  const input=document.getElementById('chat-input'); if(!input.value.trim()) return;
  socket.emit('send_chat',{message:input.value,sender_name:user.full_name,sender_role:user.role});
  input.value='';
}
document.getElementById('chat-input')?.addEventListener('input',()=>{ socket.emit('typing', user.full_name); });
document.getElementById('chat-input')?.addEventListener('keypress',(e)=>{ if(e.key==='Enter') sendChat(); });

async function loadChat(){ const res=await fetch('/api/chat'); const chats=await res.json(); document.getElementById('chat-box').innerHTML=''; chats.forEach(appendChat); }

// PDF Preview Functions
function openPDF(path, title){
  document.getElementById('pdf-title').innerText=title;
  document.getElementById('pdf-frame').src=path;
  document.getElementById('pdf-modal').classList.remove('hidden');
}
function closePDF(){ document.getElementById('pdf-modal').classList.add('hidden'); document.getElementById('pdf-frame').src=''; }

// Override loadNotes to include preview button
const oldLoadNotes=loadNotes;
loadNotes = async function(){
  const res=await fetch('/api/notes'); const notes=await res.json();
  document.getElementById('notes-list').innerHTML=notes.map(n=>`
    <div class="item">
      <div><b>${n.course_code}</b> - ${n.title}<br><small>By ${n.uploader} on ${n.upload_date}</small></div>
      <div style="display:flex;gap:6px">
        <button onclick="openPDF('${n.file_path}','${n.title}')" style="background:#f0f0ff;border:none;padding:6px 12px;border-radius:20px;cursor:pointer">👁️ View</button>
        <a href="${n.file_path}" target="_blank" download style="background:#6a5cff;color:white;padding:6px 12px;border-radius:20px;text-decoration:none">Download</a>
      </div>
    </div>`).join('')||'No notes yet';
}

// Init chat on login
const oldInit=initApp;
initApp=function(){ oldInit(); loadChat(); }