import { Check } from "loudo-check"
import { Loud } from "loudify"


let i18n = <T>(value:T):string => {
  return String(value)
}

export const i18nWith = (internationalizer:<T>(text:T)=>string) => {
  i18n = internationalizer
}


// Model is updated once onsubmit:
//    All fields are bound (in case of third party update)
//    onsubmit checks all properties, then updates errors or continues

// Model is updated as user tabs through fields:
//    All fields are bound
//    onchange back to the field


// 

type ChangeType = "onsubmit" | "onchange" | "oninput"

interface Field<T extends object,K extends keyof T> {
  key:K
  label:string
  input:()=>HTMLElement
  changeType:ChangeType
}

class Section<T extends object> {
  constructor(
    public readonly fields:Field<T,any>[] = []
  ){}

  readonly field = (key:keyof T, label:string, input:()=>HTMLElement, changeType:ChangeType = "onsubmit") => {
    this.fields.push({key, label, input, changeType})
  }

}

type Errors<T extends object> = Record<keyof T,Check.Fail|undefined>

class Form<T extends object> {

  private readonly formo:Formo
  private readonly sample:Loud<T>
  private readonly model:T
  private readonly sections:Section<T>[] = [new Section<T>()]
  private readonly errors:Record<string,Check.Fail> = {}

  constructor(formo:Formo, sample:Loud<T>, model:T) {
    this.formo = formo
    this.sample = sample
    this.model = model
  }

  get lastSection():Section<T> { 
    return this.sections[this.sections.length - 1]!
  }
  
  readonly field = (key:keyof T, label:string, input:()=>HTMLElement) => {
    this.lastSection.field(key, label, input)
  }

  readonly build = () => {
    const formo = this.formo
    const result = formo.makeForm()
    for (const section of this.sections) {
      const div = formo.sectionLayout(result, section)
      for (const field of section.fields) {
        const label = formo.label(field.label)
        const input = field.input() // .bindAttr("value", this.model, field.key)
        // TODO apply min, max, etc from check
        input.onchange = () => void {

        }
        const error = formo.error()
        label.setAttribute("for", input.id)
        input.setAttribute("name", field.key)
        formo.fieldLayout(div, label, input, error)
      }
      // TODO section renderer

    }
    return result
  }
}

export class Formo {

  constructor(
    public makeForm:()=>HTMLElement,
    public label:(name:string)=>HTMLElement,
    public error:()=>HTMLElement,
    public sectionLayout:(parent:HTMLElement, section:Section<any>)=>HTMLElement,
    public fieldLayout:(parent:HTMLElement, label:HTMLElement, field:HTMLElement, error:HTMLElement)=>void
  ){}

  readonly form = <T extends object>(sample:Loud<T>, model:T):Form<T> => {
    return new Form(this, sample, model)
  }

  static get shared():Formo {
    return shared
  }

}

const shared = new Formo(
  ()=>{ return document.createElement("form") },
  ()=>{ return document.createElement("label") },
  ()=>{ return document.createElement("div") },
  (parent:HTMLElement, section:Section<any>) => parent,
  (parent:HTMLElement, label:HTMLElement, field:HTMLElement, error:HTMLElement) => {
    parent.appendChild(label)
    parent.appendChild(field)
    parent.appendChild(error)
  }
)
