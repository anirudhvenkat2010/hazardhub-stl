#!/usr/bin/env python3
"""HazardHub architecture diagrams. uv run --with pillow python assets/gen_diagrams.py -> demo/diagrams/"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'demo', 'diagrams')
os.makedirs(OUT, exist_ok=True)
BG=(21,32,43); SURFACE=(30,44,58); SURFACE2=(38,55,73); ACCENT=(242,163,60)
TEXT=(241,246,251); MUTED=(155,176,196); BORDER=(49,70,90); OK=(39,174,96); WARN=(242,201,76)
W,H=1600,900


def font(sz, bold=False):
    for p in (['/System/Library/Fonts/SFNSRounded.ttf'] if bold else ['/System/Library/Fonts/SFNS.ttf','/System/Library/Fonts/Helvetica.ttc']):
        if os.path.exists(p):
            try: return ImageFont.truetype(p, sz)
            except Exception: pass
    return ImageFont.load_default()

def canvas():
    img=Image.new('RGB',(W,H),BG); return img, ImageDraw.Draw(img)
def box(d,x,y,w,h,fill=SURFACE,outline=BORDER,width=2,r=18): d.rounded_rectangle([x,y,x+w,y+h],radius=r,fill=fill,outline=outline,width=width)
def ctext(d,cx,y,s,f,fill=TEXT):
    b=d.textbbox((0,0),s,font=f); d.text((cx-(b[2]-b[0])/2,y),s,font=f,fill=fill)
def ltext(d,x,y,s,f,fill=TEXT): d.text((x,y),s,font=f,fill=fill)
def arrow(d,x1,y1,x2,y2,color=ACCENT,width=4):
    import math; d.line([(x1,y1),(x2,y2)],fill=color,width=width); ang=math.atan2(y2-y1,x2-x1); L=16
    for deg in (150,-150):
        da=math.radians(deg); d.line([(x2,y2),(x2-L*math.cos(ang+da),y2-L*math.sin(ang+da))],fill=color,width=width)
def title(d,s,sub=None):
    ctext(d,W/2,46,s,font(52,True),TEXT)
    if sub: ctext(d,W/2,112,sub,font(26),ACCENT)


# 1: the 4-step pipeline
def d1():
    img,d=canvas(); title(d,'Four taps, not a scavenger hunt','HazardHub does the hard 90%')
    steps=[('📷 Capture','photo of the hazard',ACCENT),
           ('📍 Locate','GPS + reverse-geocode to county, on-device',OK),
           ('🧭 Route','City / County / MoDOT by who owns the road',ACCENT),
           ('📨 Send','opens the agency form / call with report ready',OK)]
    x=90
    for i,(h,sub,col) in enumerate(steps):
        box(d,x,300,320,220,fill=SURFACE,outline=col,width=3)
        ctext(d,x+160,335,h,font(30,True),col)
        # wrap sub
        words=sub.split(' '); line=''; yy=392
        for w_ in words:
            test=(line+' '+w_).strip()
            if d.textbbox((0,0),test,font=font(19))[2] > 290:
                ctext(d,x+160,yy,line,font(19),MUTED); line=w_; yy+=28
            else: line=test
        ctext(d,x+160,yy,line,font(19),MUTED)
        if i<3: arrow(d,x+320,410,x+360,410)
        x+=360
    box(d,300,600,1000,180,fill=SURFACE2)
    ctext(d,800,624,'The parts people get stuck on — gone',font(26,True),TEXT)
    ltext(d,340,678,'• Which of 3 agencies owns this road?  → routed for you',font(21),MUTED)
    ltext(d,340,714,'• What\u2019s the exact location + county?  → captured for you',font(21),MUTED)
    ltext(d,340,750,'• Where\u2019s the right form?  → opened, prefilled, one tap to send',font(21),MUTED)
    img.save(os.path.join(OUT,'01-flow.png'))


# 2: honest scope
def d2():
    img,d=canvas(); title(d,'Honest about the seams','An assistant, not a fake submit button')
    box(d,200,210,1200,180,fill=SURFACE,outline=WARN,width=2)
    ctext(d,800,232,'Why it hands off instead of auto-submitting',font(26,True),WARN)
    ltext(d,250,286,'• MoDOT\u2019s report form is CAPTCHA-protected with no public API',font(22),MUTED)
    ltext(d,250,322,'• No St. Louis-area reporting app; the City & County have no API either',font(22),MUTED)
    ltext(d,250,358,'• So no app can legitimately file for you here — faking it would mislead',font(22),MUTED)
    box(d,200,430,1200,170,fill=SURFACE,outline=OK,width=2)
    ctext(d,800,452,'What HazardHub does instead',font(26,True),OK)
    ltext(d,250,506,'• Does the capture, locate, route, and compose — the tedious 90%',font(22),MUTED)
    ltext(d,250,542,'• Opens the right agency with your report ready; you tap send',font(22),MUTED)
    box(d,200,640,1200,150,fill=SURFACE2)
    ctext(d,800,662,'Routing is best-effort + always overridable',font(24,True),TEXT)
    ctext(d,800,706,'Highways cross every jurisdiction, so the user can switch City / County / MoDOT',font(20),MUTED)
    ctext(d,800,740,'in one tap — the app explains what each covers',font(20),MUTED)
    img.save(os.path.join(OUT,'02-honest.png'))


# 3: architecture
def d3():
    img,d=canvas(); title(d,'Clean, tested architecture','React Native · Expo · TypeScript')
    box(d,300,190,1000,100,fill=SURFACE2); ctext(d,800,212,'Screens: Report · History · Settings',font(27,True)); ctext(d,800,254,'read from the store, call the data layer',font(20),MUTED)
    arrow(d,800,290,800,345)
    box(d,300,345,1000,95,fill=BG,outline=ACCENT,width=3); ctext(d,800,365,'AppStore (React context)',font(26,True),ACCENT); ctext(d,800,405,'theme · saved reports (AsyncStorage)',font(20),MUTED)
    arrow(d,640,440,520,530); arrow(d,960,440,1080,530)
    box(d,250,530,540,250,fill=SURFACE,outline=BORDER,width=2); ctext(d,520,552,'Data layer',font(26,True),TEXT)
    ltext(d,290,604,'• location.ts — GPS → county (on-device)',font(20),MUTED)
    ltext(d,290,640,'• agencies.ts — county → agency routing',font(20),MUTED)
    ltext(d,290,676,'• report.ts — compose text + hand-off links',font(20),MUTED)
    ltext(d,290,724,'unit-tested routing + composition',font(20),OK)
    box(d,1020,530,330,250,fill=SURFACE,outline=BORDER,width=2); ctext(d,1185,552,'Device APIs',font(26,True),TEXT)
    ltext(d,1055,604,'• expo-image-picker (camera)',font(20),MUTED)
    ltext(d,1055,640,'• expo-location (GPS)',font(20),MUTED)
    ltext(d,1055,676,'• light/dark/system theme',font(20),MUTED)
    ltext(d,1055,724,'accessible, offline-tolerant',font(20),OK)
    img.save(os.path.join(OUT,'03-arch.png'))


# 4: illustrative hazard-map mock (represents the native MapView with pins)
def d4():
    img,d=canvas(); title(d,'Reports on a hazard map','Illustrative — the app plots your located reports')
    mx,my,mw,mh=200,190,1200,560
    # map panel + faux streets
    box(d,mx,my,mw,mh,fill=SURFACE,outline=BORDER,width=2,r=24)
    for gx in range(mx+90,mx+mw-40,150):
        d.line([(gx,my+30),(gx,my+mh-30)],fill=SURFACE2,width=6)
    for gy in range(my+80,my+mh-30,130):
        d.line([(mx+40,gy),(mx+mw-40,gy)],fill=SURFACE2,width=6)
    # a 'river' curve
    d.line([(mx+mw-260,my+40),(mx+mw-320,my+260),(mx+mw-220,my+mh-40)],fill=(40,70,96),width=18,joint='curve')
    import math
    def pin(cx,cy,col,glyph):
        r=26
        d.ellipse([cx-r,cy-r-10,cx+r,cy+r-10],fill=col)
        d.polygon([(cx-14,cy+6),(cx+14,cy+6),(cx,cy+30)],fill=col)
        d.ellipse([cx-10,cy-20,cx+10,cy],fill=BG)
        ctext(d,cx,cy-20,glyph,font(18,True),col)
    # hazard pins (accent) + urgent pins (red)
    RED=(235,87,87)
    pins=[(mx+260,my+170,ACCENT),(mx+470,my+330,ACCENT),(mx+700,my+210,ACCENT),
          (mx+560,my+470,RED),(mx+880,my+400,ACCENT),(mx+980,my+240,RED),(mx+360,my+470,ACCENT)]
    for cx,cy,col in pins: pin(cx,cy,col,'')
    # legend
    lx,ly=mx+40,my+mh-70
    d.ellipse([lx,ly,lx+26,ly+26],fill=ACCENT); ltext(d,lx+36,ly,'Hazard',font(22),MUTED)
    d.ellipse([lx+190,ly,lx+216,ly+26],fill=RED); ltext(d,lx+226,ly,'Urgent incident (accident / power line)',font(22),MUTED)
    ctext(d,W/2,my+mh+40,'Today the map shows your own reports; a shared community feed is the next phase.',font(20),MUTED)
    img.save(os.path.join(OUT,'04-map.png'))


# 5: end-to-end user flow for submitting a report — split across two pages
def d5():
    def node(d,cx,cy,w,h,lines,fill=SURFACE,outline=ACCENT,wdt=3,r=16,sub_i=None,fsz=24):
        box(d,cx-w/2,cy-h/2,w,h,fill=fill,outline=outline,width=wdt,r=r)
        n=len(lines); lh=34
        y0=cy-(n*lh)/2+6
        for i,ln in enumerate(lines):
            f=font(fsz,True) if (sub_i is None or i<sub_i) else font(20)
            col=TEXT if (sub_i is None or i<sub_i) else MUTED
            ctext(d,cx,y0+i*lh,ln,f,col)

    def diamond(d,cx,cy,w,h,label,col=WARN):
        pts=[(cx,cy-h/2),(cx+w/2,cy),(cx,cy+h/2),(cx-w/2,cy)]
        d.polygon(pts,fill=SURFACE)
        for i in range(len(pts)): d.line([pts[i],pts[(i+1)%len(pts)]],fill=col,width=3)
        ctext(d,cx,cy-13,label,font(21,True),col)

    cx=800; W1=520; H1=96; RED=(235,87,87)

    # ---- Page 1: capture ----
    img,d=canvas(); title(d,'User flow (1 of 2): capture','Open the app \u2192 pin the hazard')
    node(d,cx,230,W1,H1,['1 · Open app','pick what you\u2019re reporting'],sub_i=1)
    arrow(d,cx,278,cx,330)
    diamond(d,cx,385,420,104,'Urgent? accident / power line',WARN)
    arrow(d,cx+210,385,cx+360,385,color=RED); ltext(d,cx+225,350,'yes',font(19),RED)
    node(d,cx+560,385,420,100,['Call 911 first','the app does not dispatch help'],outline=RED,sub_i=1,fsz=21)
    arrow(d,cx,437,cx,500); ltext(d,cx+16,455,'no / after calling',font(18),MUTED)
    node(d,cx,555,W1,H1,['2 · Take / choose photo','AI suggests a type (optional)'],sub_i=1)
    arrow(d,cx,603,cx,660)
    node(d,cx,715,W1,H1,['3 · Use my location','GPS \u2192 county, on-device'],sub_i=1,outline=OK)
    ctext(d,cx,800,'\u2193  continues on page 2',font(22,True),ACCENT)
    img.save(os.path.join(OUT,'05-userflow-1.png'))

    # ---- Page 2: route + send ----
    img,d=canvas(); title(d,'User flow (2 of 2): route & send','Route to the right agency \u2192 you send it')
    ctext(d,cx,150,'\u2193  continued from page 1',font(22,True),ACCENT)
    node(d,cx,235,W1,H1,['4 · Severity + details','small / medium / large + a note'],sub_i=1)
    arrow(d,cx,283,cx,335)
    node(d,cx,390,W1,H1,['6 · Report to','auto-routed \u00b7 override City / County / MoDOT'],sub_i=1,fsz=22)
    arrow(d,cx,438,cx,490)
    node(d,cx,545,W1,H1,['7 · Send','opens the agency form / call / map'],sub_i=1,outline=OK)
    arrow(d,cx,593,cx,645)
    node(d,cx,700,W1,H1,['You tap send \u2014 report prefilled','saved to History + the hazard map'],sub_i=1,outline=OK)
    img.save(os.path.join(OUT,'05-userflow-2.png'))


d1(); d2(); d3(); d4(); d5(); print('Wrote 5 diagrams to', OUT)
