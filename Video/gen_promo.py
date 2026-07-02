import base64, os
IMG="/sessions/blissful-quirky-hypatia/mnt/AgroCore/web/img"
def datauri(fn):
    with open(os.path.join(IMG,fn),"rb") as f:
        return "data:image/png;base64,"+base64.b64encode(f.read()).decode()
LOGO_FULL=datauri("logo-full-512.png")
LOGO_WHITE=datauri("logo-white-256.png")
print("full",len(LOGO_FULL),"white",len(LOGO_WHITE))
with open("logo_full.txt","w") as f: f.write(LOGO_FULL)
with open("logo_white.txt","w") as f: f.write(LOGO_WHITE)
