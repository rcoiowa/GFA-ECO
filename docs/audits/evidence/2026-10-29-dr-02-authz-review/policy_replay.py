import re,glob,os,json,sys
d=sys.argv[1]; files=sorted(glob.glob(d+"/*.sql"))
pol={}; rls=set(); tables={}
for f in files:
    s=open(f).read()
    s=re.sub(r"--[^\n]*","",s)
    for m in re.finditer(r"drop\s+policy\s+if\s+exists\s+(\w+)\s+on\s+([\w.]+)|drop\s+policy\s+(\w+)\s+on\s+([\w.]+)",s,re.I):
        n=m.group(1) or m.group(3); t=(m.group(2) or m.group(4)).split(".")[-1]; pol.pop((t,n),None)
    for m in re.finditer(r"create\s+policy\s+(\w+)\s+on\s+([\w.]+)(.*?);",s,re.I|re.S):
        n,t,rest=m.group(1),m.group(2).split(".")[-1],m.group(3)
        cmd=re.search(r"for\s+(all|select|insert|update|delete)",rest,re.I); to=re.search(r"\bto\s+([\w, ]+?)\s+(using|with)",rest,re.I)
        u=re.search(r"using\s*\((.*)",rest,re.I|re.S)
        pol[(t,n)]={"file":os.path.basename(f),"cmd":(cmd.group(1).lower() if cmd else "all"),"to":(to.group(1).strip() if to else "public"),"expr":" ".join(rest.split())[:400]}
    for m in re.finditer(r"alter\s+table\s+([\w.]+)\s+enable\s+row\s+level\s+security",s,re.I): rls.add(m.group(1).split(".")[-1])
    for m in re.finditer(r"create\s+table\s+(?:if\s+not\s+exists\s+)?([\w.]+)",s,re.I): tables.setdefault(m.group(1).split(".")[-1],os.path.basename(f))
out={"policies":[{"table":t,"name":n,**v} for (t,n),v in sorted(pol.items())],"rls_enabled":sorted(rls),"tables":tables}
json.dump(out,open(sys.argv[2],"w"),indent=1)
print(len(out["policies"]),"policies;",len(rls),"rls tables;",len(tables),"tables")
print("tables without RLS enable:",sorted(set(tables)-rls))
