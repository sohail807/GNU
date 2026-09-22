import proteus.config

print("proteus.config methods:")
for m in dir(proteus.config):
    if not m.startswith('__'):
        print(" ", m)
