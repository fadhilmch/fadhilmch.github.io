const{test}=require('node:test'),a=require('node:assert/strict'),M=require('../../stroller-bus/map.js');
const data={stops:[{lat:59,lon:18},{lat:59.1,lon:18.1},{lat:59.2,lon:18.2}],trips:[{id:'t',calls:[{stop:0,departure:10,arrival:10},{stop:1,departure:20,arrival:20},{stop:2,departure:30,arrival:30}]}]};
test('bus map includes intermediate stops in order',()=>{const r=M.legs({path:[{kind:'bus',trip:'t',line:'53',from:0,to:2,departure:10,arrival:30}]},data);a.deepEqual(r[0].points,[[59,18],[59.1,18.1],[59.2,18.2]])});
test('walk maps selected origin/destination coordinates',()=>{const r=M.legs({path:[{kind:'walk',to:0},{kind:'walk',from:2}]},data,{coord:[58,17]},{coord:[60,19]});a.deepEqual(r[0].points[0],[58,17]);a.deepEqual(r[1].points[1],[60,19])});
test('fallback bus endpoints when trip missing',()=>{a.equal(M.legs({path:[{kind:'bus',from:0,to:2,trip:'missing'}]},data)[0].points.length,2)});
