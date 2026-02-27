def testIF():# if has bug by filbert
    if a==1:
        a(1)
    elif a==2:
        b()
    else:
        c()
    def b(b):
        c(c)
        def c(c):
            a(c)
    
def testFor():
    for x in range(10):
        a()

def a(a):
    print(a)