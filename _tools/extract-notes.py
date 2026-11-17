import json, wave, math, struct, sys, os
src_wav, manifest, outdir = sys.argv[1:4]
m = json.load(open(manifest))
rate = m['rate']
w = wave.open(src_wav); frames = w.readframes(w.getnframes()); w.close()
pcm = struct.unpack('<%dh' % (len(frames)//2), frames)
open_midi = [40,45,50,55,59,64]
hz = lambda midi: 440*2**((midi-69)/12)
# (string, fret, touch)
wanted = [(1,3,'thumb'),(2,2,'thumb'),(0,3,'thumb'),(2,0,'thumb'),(1,2,'thumb'),
          (5,0,'finger'),(4,1,'finger'),(3,0,'finger'),(5,3,'finger'),(4,0,'finger')]
os.makedirs(outdir, exist_ok=True)
out = {'level': m['level'], 'notes': {}}
dur = int(2.4*rate); fade = int(0.4*rate)
used = {}
for s,f,t in wanted:
    target = hz(open_midi[s]+f)
    cands = [n for n in m['notes'] if n['string']==s and n['touch']==t]
    best = cands[0]
    for c in cands:
        if abs(math.log(target/c['hz'])) < abs(math.log(target/best['hz'])): best = c
    name = f"{t}-{s}-{best['fret']}"
    if name not in used:
        n = min(dur, best['count'])
        seg = [int(x*3.0) for x in pcm[best["start"]:best["start"]+n]]
        for i in range(fade):
            k = n-fade+i
            if 0 <= k < n: seg[k] = int(seg[k]*(1-i/fade)**2)
        ww = wave.open(os.path.join(outdir, name+'.wav'),'wb'); ww.setnchannels(1); ww.setsampwidth(2); ww.setframerate(rate)
        ww.writeframes(struct.pack('<%dh'%len(seg), *seg)); ww.close()
        used[name]=1
    out['notes'][f"{s}:{f}"] = {'file': name, 'rate': round(target/best['hz'], 5)}
json.dump(out, open(os.path.join(outdir,'notes.json'),'w'), indent=1)
print(json.dumps(out, indent=1))
