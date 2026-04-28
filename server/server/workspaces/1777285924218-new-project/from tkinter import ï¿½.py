from tkinter import *
from tkinter import ttk

converter = Tk()
converter.geometry("600x400")
converter.title("Currency Converter")

OPTIONS = {
    "Australian Dollar":49.10,
    "Brazilian Real" : 17.30,
    "British Pound" : 90.92,
    "Chinese Yuan" : 10.29,
    "SriLankan Rupee" : 0.39,
    "Pakistani Rupee" : 0.49,
    "US Dollar" : 69.32
}

def ok():
    price = rupees.get()
    answer = variable.get()
    DICT = OPTIONS.get(answer,None)
    converted = float(DICT)*float(price)
    result.delete(1.0,END)
    result.insert(INSERT,"Price In ",INSERT,answer,INSERT," = ",
                  INSERT,converted)
appName = Label(converter,text="Currency",
                font=("arial",25,"bold","underline"),fg="dark red")
appName.grid(row=0,column=0,padx=10)
appName = Label(converter,text="Converter",
                font=("arial",25,"bold","underline"),fg="dark red")
appName.grid(row=0,column=1,ipadx=10)

result = Text(converter,height=5,width=50,font=("arial",10,"bold"),bd=5)
result.grid(row=1,columnspan=10,padx=3)

india = Label(converter,text="Indian Rupees:",
              font=("arial",10,"bold"),fg="red")
india.grid(row=2,column=0)
rupees = Entry(converter,font=("calibri",20))
rupees.grid(row=2,column=1)
choice = Label(converter,text="Choose Country:",
               font=("arial",10,"bold"),fg="red")
choice.grid(row=3,column=0)
variable = StringVar(converter)
variable.set(None)
option = OptionMenu(converter,variable, *OPTIONS)
option.grid(row=3,column=1,sticky="ew")
button = Button(converter,text="Convert",fg="green",
                font=("calibri",20),bg="powder blue",command=ok)
button.grid(row=3,column=2)
mainloop()      