"""Create a fresh local-only application replay and run real Edge/Postgres adapter tests."""
import pathlib,re,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[2]
container,database=sys.argv[1:]
assert re.fullmatch(r'recoveryos-[a-z0-9-]+',container) and re.fullmatch(r'housing_[a-z0-9_]+',database)
subprocess.run([sys.executable,str(root/'docs/proposals/housing-follow-through/test-full-schema.py'),container,database],check=True,stdout=subprocess.DEVNULL)
for name in ['token-role-schema.sql','exchange-schema.sql','test-token-role.sql']:
    source=(pathlib.Path(__file__).parent/name).read_text()
    # Roles are cluster-wide across throwaway databases. Reuse only in this local harness.
    for role in ['recoveryos_bridge_client','recoveryos_bridge_worker']:
        exists=subprocess.check_output(['docker','exec',container,'psql','-U','postgres','-d',database,'-Atc',f"select count(*) from pg_roles where rolname='{role}'"],text=True).strip()=='1'
        if exists: source=re.sub(r'create role '+role+r' [^;]+;', '-- Existing isolated-test role reused.',source)
    subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-d',database,'-q','-v','ON_ERROR_STOP=1'],input=source,text=True,check=True,stdout=subprocess.DEVNULL)
print('PASS fresh application-schema replay and unapplied proposal installation in local database',flush=True)
subprocess.run(['node',str(pathlib.Path(__file__).parent/'test-postgres.mjs'),container,database],check=True)
subprocess.run([sys.executable,str(pathlib.Path(__file__).parent/'test-postgrest-isolation.py'),container,database],check=True)
