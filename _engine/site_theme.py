"""Engine 56 / tools 21 (her 1.11 07:38: «по умолчанию светлую» — many students share their screen for each other, and one student's
dark theme would show the other a dark, odd-looking page): the whole site is light for everyone by default; at the bottom, beside
Impressum · Datenschutz, "🌙 Dark theme" / "☀️ Light theme" — the choice is kept on the device for every page of the site (localStorage
site-theme). The pages' dark colours already key on data-theme ("dark" = dark, "light" = light whatever the system says).
Every build script runs its pages through add()."""
import re
HEAD = ('<script>/* the site theme: light unless this device chose dark (engine 56) */(function(){var t="light";'
        'try{if(localStorage.getItem("site-theme")==="dark")t="dark"}catch(e){}document.documentElement.setAttribute("data-theme",t)})();</script>\n')
BODY = '''<style>.theme-tg{font:inherit;font-size:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-decoration:underline;text-underline-offset:2px}</style>
<script>/* 🌙 Dark theme / ☀️ Light theme beside Impressum · Datenschutz (engine 56) */(function(){
var H=document.documentElement,lab=function(){return H.getAttribute("data-theme")==="dark"?"☀️ Light theme":"🌙 Dark theme"};
function paint(){document.querySelectorAll(".theme-tg").forEach(function(b){b.textContent=lab()})}
function add(){document.querySelectorAll("footer.legal, p.legal").forEach(function(f){if(f.querySelector(".theme-tg"))return;var b=document.createElement("button");b.type="button";b.className="theme-tg";
b.addEventListener("click",function(){var d=H.getAttribute("data-theme")==="dark"?"light":"dark";H.setAttribute("data-theme",d);try{localStorage.setItem("site-theme",d)}catch(e){}paint()});
f.appendChild(document.createTextNode(" · "));f.appendChild(b)});paint()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();
addEventListener("storage",function(e){if(e.key==="site-theme"){H.setAttribute("data-theme",e.newValue==="dark"?"dark":"light");paint()}})})();</script>
'''
def add(html):
    if 'site-theme' in html: return html
    m = re.search(r'<meta charset="utf-8">\s*\n?', html, re.I) or re.search(r'<head>\s*\n?', html, re.I)
    if m: html = html[:m.end()] + HEAD + html[m.end():]
    i = html.lower().rfind('</body>')
    return html[:i] + BODY + html[i:] if i > -1 else html + BODY
