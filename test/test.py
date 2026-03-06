
g=Gog(1,"s")
# 定义 Animal 父类
class Animal:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def speak(self):
        return "Some sound"

    def __str__(self):
        return f"{self.__class__.__name__}({self.name}, {self.age}岁)"

    def __repr__(self):
        return f"Animal('{self.name}', {self.age})"

    def __eq__(self, other):
        if isinstance(other, Animal):
            return self.name == other.name and self.age == other.age
        return False


# 定义 Dog 子类
class Dog(Animal):
    def __init__(self, name, age, breed):
        super().__init__(name, age)
        self.breed = breed

    def speak(self):
        return "汪汪汪"

    def __str__(self):
        return f"狗({self.name}, {self.age}岁, {self.breed})"


# 定义 Cat 子类
class Cat(Animal):
    def __init__(self, name, age, color):
        super().__init__(name, age)
        self.color = color

    def speak(self):
        return "喵喵喵"

    def __str__(self):
        return f"猫({self.name}, {self.age}岁, {self.color})"


# 测试函数
def test_animals(a,b):
    animals = [
        Dog("旺财", 3, "金毛"),
        Cat("咪咪", 2, "白色"),
        Dog("小黑", 4, "拉布拉多"),
        Cat("花花", 1, "橘色")
    ]

    print("=== 动物列表 ===")
    for i, animal in enumerate(animals, 1):  # for 循环 + enumerate
        print(f"{i}. {animal}")

    print("\n=== 动物叫声 ===")
    for animal in animals:  # foreach 风格
        print(f"{animal.name}: {animal.speak()}")

    print("\n=== 条件判断 ===")
    for animal in animals:
        if animal.age < 3:
            print(f"{animal.name} 是幼年动物")
        elif animal.age < 5:
            print(f"{animal.name} 是成年动物")
        else:
            print(f"{animal.name} 是老年动物")

    print("\n=== 类型判断 ===")
    for animal in animals:
        if isinstance(animal, Dog):
            print(f"{animal.name} 是狗，品种：{animal.breed}")
        elif isinstance(animal, Cat):
            print(f"{animal.name} 是猫，颜色：{animal.color}")

    print("\n=== 魔术方法测试 ===")
    dog1 = Dog("旺财", 3, "金毛")
    dog2 = Dog("旺财", 3, "金毛")
    dog3 = Dog("小黑", 4, "拉布拉多")

    print(f"dog1: {dog1}")           # __str__
    print(f"repr: {repr(dog1)}")     # __repr__
    print(f"dog1 == dog2: {dog1 == dog2}")  # __eq__
    print(f"dog1 == dog3: {dog1 == dog3}")

    print("\n=== 列表推导式 ===")
    names = [animal.name for animal in animals]
    print(f"所有名字: {names}")

    adult_animals = [a for a in animals if a.age >= 3]
    print(f"成年动物: {[a.name for a in adult_animals]}")


# 程序入口
if __name__ == "__main__":
    test_animals(1,1)
    ls=[1,2,test_animals()]
    obj={
        "a":1,
        "b":test_animals(1)
    }