public class Animal
{
    public string Name { get; set; }
    public Dog species=new Dog()
    public string Breed = Prop()

    public async void Speak()
    {
        Console.WriteLine("Some generic animal sound");
        if(a==0){
            aa()
        }else if(b==0){
            if(bb==0){bbb()}
            bb()
        }else{
            cc()
        }
    }
}

public class Dog : Animal
{
    public string Breed { get; set; }

    public override void Speak()
    {
        Console.WriteLine("Woof!");
    }

    public void Fetch()
    {
        Console.WriteLine($"{Name} is fetching the ball.");
    }
}