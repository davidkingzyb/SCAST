class Anima {
    name: string;
  
    constructor(name: string) {
      this.name = name;
    }
  
    makeSound(): void {
      console.log("Some generic animal sound");
    }
  }
  
  
  class Cat extends Anima {
    constructor(name: string) {
      super(name); // 调用父类的构造函数
    }
  
    makeSound(): void {
      console.log("Meow"); // 重写父类的方法
    }
  }
  
  
  const myCat = new Cat("Whiskers");
  myCat.makeSound(); // 输出: Meow