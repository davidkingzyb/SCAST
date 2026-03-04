using System;
using System.Collections.Generic;
using OPP;

namespace OPP{

// 1. 接口 (interface)
interface ISpeak
{
    void Speak();
}

// 2. 父类 (Class & Inheritance)
class Animal : ISpeak
{
    public string Name;
    public int Age;

    // 3. 构造方法 (Constructor)
    public Animal(string name, int age)
    {
        Name = name;
        Age = age;
    }

    // 4. 方法 (Method) & virtual 关键字
    public virtual void Speak()
    {
        Console.WriteLine("动物发出声音");
    }

    public void PrintInfo()
    {
        Console.WriteLine($"名字：{Name}, 年龄：{Age}");
    }
}

// 5. 子类 (Subclass)
class Dog : Animal
{
    static Cat scat=new Cat();
    // 子类构造方法，使用 base 调用父类构造
    public Dog(string name, int age) : base(name, age) { }

    // 重写父类方法 (override)
    public override void Speak()
    {
        Console.WriteLine("汪汪汪！");
    }
}

class Cat : Animal
{
    static Cat ncat=new Cat("s",1)
    private string p=GenString("aaa");
    public Cat(string name, int age) : base(name, age) { }

    public override void Speak()
    {
        Console.WriteLine("喵喵喵！");
    }
    private string GenString(string a){
        return a;
    }
}
}

class Program
{
    private Cat cat=new Cat();
    private List<Cat> cats;

    static void Main(string[] args)
    {
        Console.WriteLine("--- C# 语法测试开始 ---");
        var dog=new Dog("小黑", 3);

        dog.Speak("ok");
        Update("ok");
        Update();
        

        // 6. new 关键字 (创建对象和集合)
        List<Animal> animals = new List<Animal>();
        
        // 添加子类对象到父类列表 (多态)
        animals.Add(dog);
        animals.Add(new Cat("小白", 1));
        animals.Add(new Dog("大黄", 5));

        // 7. for 循环
        Console.WriteLine("\n--- For 循环测试 ---");
        for (int i = 0; i < 3; i++)
        {
            Console.WriteLine($"for 循环计数：{i + 1}");
            while(true){
                dog.Speak("white");
            }

            do{
                Update();

            }while(i>0);
        }

        // 8. foreach 循环
        Console.WriteLine("\n--- Foreach 循环测试 ---");
        foreach (var animal in animals)
        {
            animal.PrintInfo();

            // 9. if 条件判断
            if (animal.Age > 2)
            {
                Console.WriteLine("  -> 这是一只成年动物");
                var a=new Dog()
                if(a.Age>1){
                    a.Speak();
                }
            }
            else
            {
                Console.WriteLine("  -> 这是一只幼年动物");
            }

            // 调用接口方法
            animal.Speak();
        }

        

        Console.WriteLine("\n--- 测试结束 ---");
        Console.ReadKey();
    }
}