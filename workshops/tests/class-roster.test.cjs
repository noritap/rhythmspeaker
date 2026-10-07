// Run: node --test workshops/tests/class-roster.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/class-roster.js'),'utf8'),sandbox);
const roster=sandbox.window.RSClassRoster;
const sessions=[{id:'a',name:'初級'},{id:'b',name:'中級'},{id:'set',name:'セット',consumes:['a','b']}];
const people=[
 {name:'A',sessionId:'a',status:'reserved',paymentStatus:'paid'},
 {name:'B',sessionId:'set',status:'reserved',paymentStatus:'unpaid'},
 {name:'C',sessionId:'b',status:'cancelled',paymentStatus:'paid'},
 {name:'D',sessionId:'unknown',status:'reserved'}
];
test('セット予約は両クラスに表示し、取消を除外する',()=>{
 assert.deepEqual(Array.from(roster.members(sessions[0],people,sessions),p=>p.name),['A','B']);
 assert.deepEqual(Array.from(roster.members(sessions[1],people,sessions),p=>p.name),['B']);
});
test('存在しないクラスIDは名簿に紛れ込まない',()=>{
 assert.equal(roster.attendanceIds(people[3],sessions).length,0);
});
test('実際の受講クラスのみを列挙する',()=>{
 assert.deepEqual(Array.from(roster.classes(sessions),s=>s.id),['a','b']);
});
test('参加者名はHTMLとして解釈されない',()=>{
 const html=roster.renderCard({session:sessions[0],sessions,people:[{name:'<img src=x onerror=alert(1)>',sessionId:'a',status:'reserved'}]});
 assert.ok(html.includes('&lt;img'));
 assert.ok(!html.includes('<img'));
});
test('管理者と講師の人数は共通ロジックで一致する',()=>{
 const admin=roster.renderCard({session:sessions[0],sessions,people,showCheckin:true});
 const instructor=roster.renderCard({session:sessions[0],sessions,people,showCheckin:false});
 assert.ok(admin.includes('2名'));
 assert.ok(instructor.includes('2名'));
});
