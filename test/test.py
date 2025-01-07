class people:
    name = propfunc()
    age = testIF()
    __weight = 0
    def __init__(self,n,a,w):
        self.name = n
        self.age = a
        self.__weight = w
    def speak(self):
        print("%s 说: 我 %d 岁。" %(self.name,self.age))
 
s = student('ken',10,60,3)
s.speak()

l=[1,['a','b','c'],3]
t = ('a','b',[1,2,4],{"a":1,"b":2,'arr':[2,1],'c':3})
obj={"a":[1,2],"obj":{"a":1,'t':(1,2),'arr':[1,2]}}
x = lambda a,b : a >b

def testIF():# if has bug by filbert
    if a==1:
        a(1)
    elif a==2:
        b(lambda:a+1,1)
    else:
        c()
    def b(b):
        cvar=cc(c)
        await awt(a)
        def c(c):
            a(c)

class student(people):
    grade = ''
    def __init__(self,n,a,w,g):
        people.__init__(self,n,a,w)
        self.grade = g
    def speak(self):
        fun()
        def fun():
            
            print("%s 说: 我 %d 岁了，我在读 %d 年级"%(self.name,self.age,self.grade))            
    
def testOther(a,b=str(1),*args,**kwargs):
    """
docs    
    """
    with open('f','r') as f:
        text=f.name.read()
    try:
        raise Exception('test')
    except Exception as err:
        printexcept(err)
    finally:
        printfinally('finally')

def testFor():
    for x in range(10):
        a()
        i=0
        while True:
            i+=1
            if i==3:
                break