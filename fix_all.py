import pathlib  
import sys  
files = {  
'  \" "src/infrastructure/firebase/firestore.ts\: {\category:" data.category ?? chr 39 +electronics+chr 39 "\: \category:" data.category ?? chr 39 +action-figures+chr 39 "\},  
'  \src/test/fixtures.ts\: {\category:" chr 39 +electronics+chr 39 "\: \category:" chr 39 +action-figures+chr 39 "\},  
'}  
'  
'for path, replacements in files.items():  
'  p = pathlib.Path(path)  
'  if not p.exists():  
'    continue  
'  text = p.read_text(encoding=\utf-8\)  
'  for old, new in replacements.items():  
'    text = text.replace(old, new)  
'  p.write_text(text, encoding=\utf-8\)  
'  print(f\Fixed" -encodedCommand cABhAHQAaAA= "\)  
'  
'print(\Done\)  
