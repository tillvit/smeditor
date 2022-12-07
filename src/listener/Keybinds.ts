import { App } from "../App"
import { KEYBINDS, Modifier, SPECIAL_KEYS } from "../data/KeybindData";

const MODPROPS: ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'] = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey']
const MODORDER = [Modifier.CTRL, Modifier.ALT, Modifier.SHIFT, Modifier.META]

export class Keybinds {

  private app

  constructor(app: App) {
    this.app = app

    document.addEventListener("keydown",(e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      if (["Meta", "Control", "Shift", "Alt"].includes(e.key)) return
      
      let mods: Modifier[] = []
      for (let i = 0; i < MODPROPS.length; i++) {
        if (e[MODPROPS[i]]) mods.push(MODORDER[i])
      }
      let key = e.code
      if (key.startsWith("Digit")) key = key.slice(5)
      if (key.startsWith("Key")) key = key.slice(3)
      if (key in SPECIAL_KEYS) key = SPECIAL_KEYS[key]
    
      let matches = Object.values(KEYBINDS).filter(x=>this.compareModifiers(x.mods, mods) && x.keybind == key)
      if (matches.length > 0) { 
        let disabled = matches[0].disabled
        if (disabled instanceof Function) disabled = disabled(this.app)
        if (disabled) return
        matches[0].callback(this.app)
        e.preventDefault() 
      };
    }, false)
  }

  getKeybindString(id: string): string {
    if (!(id in KEYBINDS)){
      console.log("Couldn't find keybind with id " + id)
      return ""
    }
    let item = KEYBINDS[id]
    if (item == undefined) console.log(id)
    let mods = MODORDER.filter(x => item.mods.includes(x)).join("+")
    return mods + (mods != "" ? "+" : "") + item.keybind;
  }

  private compareModifiers(mod1: Modifier[], mod2: Modifier[]) {
    if (mod1.length != mod2.length) return false
    for (let mod of MODORDER) {
      if ((mod1.includes(mod) ? 1 : 0) + (mod2.includes(mod) ? 1 : 0) == 1) return false
    }
    return true
  }
}
