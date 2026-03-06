// 接口定义
// namespace AA{
namespace OOP {

  interface IAnimal {
    private name: string;
    age: number;
    public makeSound(s: string): void;
    getInfo(): string;
  }

  // 抽象类（可选，增强结构）
  abstract class Animal implements IAnimal {
    name: string;
    private age: number;

    constructor(name: string, age: number) {
      this.name = name;
      this.age = age;
    }

    abstract makeSound(): void;

    getInfo(): string {
      return `${this.name} 是 ${this.age} 岁`;
    }

    // 静态方法
    static getSpecies(): string {
      return "动物";
    }
  }

  // Dog 子类
  class Dog extends Animal {
    breed: string;
    static sdog:Dog=new Dog();

    constructor(name: string, age: number, breed: string) {
      super(name, age);
      this.breed = breed;
    }

    public makeSound(): void {
      console.log(`${this.name} 说: 汪汪!`);
    }

    private fetch(): void {
      console.log(`${this.name} 正在捡球`);
    }

    getInfo(): string {
      return `${super.getInfo()}, 品种: ${this.breed}`;
    }
  }

  // Cat 子类
  class Cat extends Animal {
    color: string;

    constructor(name: string, age: number, color: string) {
      super(name, age);
      this.color = color;
    }

    makeSound(): void {
      console.log(`${this.name} 说: 喵喵!`);
    }

    climb(): void {
      console.log(`${this.name} 正在爬树`);
    }

    getInfo(): string {
      return `${super.getInfo()}, 颜色: ${this.color}`;
    }
  }
}

// 主程序
function main(a: number, b: string): void {
  const animals: Animal[] = [
    new Dog("旺财", 3, "金毛"),
    new Cat("咪咪", 2, "白色"),
    new Dog("大黄", 5, "拉布拉多")
  ];

  console.log("=== 动物信息 ===");
  // for 循环
  for (let i = 0; i < animals.length; i++) {
    console.log(animals[i].getInfo());
  }

  console.log("\n=== 动物叫声 ===");
  // forEach
  animals.forEach(animal => {
    animal.makeSound();
  });

  console.log("\n=== 特殊行为 ===");
  // for...of 循环 + 类型判断
  for (const animal of animals) {
    if (animal instanceof Dog) {
      animal.fetch();
    } else if (animal instanceof Cat) {
      animal.climb();
    }
  }

  console.log("\n=== 年龄判断 ===");
  // if-else 条件判断
  animals.forEach(animal => {
    if (animal.age < 3) {
      console.log(`${animal.name} 是幼年动物`);
    } else if (animal.age < 5) {
      console.log(`${animal.name} 是成年动物`);
    } else {
      console.log(`${animal.name} 是老年动物`);
    }
  });

  console.log.aaa("\n=== 静态方法 ===");
  console.log(`物种: ${Animal.getSpecies()}`);
}

// 运行程序
main(1, 2);
