var varfunc=function(a){
}
function func(e){
    func1(1)
    function func1(e){
        func2(2)
        function func2(e){
            
        }
    }
}

var obj={objfunc:function(e){

},arrfunc:(e)=>{

},a:1,b:2}


class Animal {
    name=getN()
    species=new Sp()
    constructor(name, species) {
        this.name = name;
        this.species = species;
    }

    makeSound() {
        console.log(`${this.name} makes a sound`);
    }
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name, 'Dog'); 
        this.breed = breed;
    }

    makeSound() {
        console.log(`${this.name} barks`);
        func()
    }

    fetch() {
        console.log(`${this.name} is fetching a ball`);
    }
}

const myDog = new Dog('Buddy', 'Golden Retriever');

myDog.makeSound(); 

console.log(myDog.breed); 

myDog.fetch(); 



function testES5(t){

    if(t=='for'){
        for(i=0; i<=10; i++){
            if(i%2==1)continue
            console.log('for',i)
        }
    }else if(t=='while'){
        let i=0;
        while(true){
            i++
            if(i>10)break
        }
    }else if(t=='do'){
        do{
            console.log(a)
        }while(a<10); 
    }else{
        console.log('other')
    }
    
    switch(t){
        case "forin":
            for(let k in {'a':'aa','b':'bb','c':'cc'}){
                console.log(k)
            }
            break
        case "forof":
            for (let x of ['a','b','c']) {
                console.log(x);
            }
            break
        default:
            console.log('switch default t')
    }

    try{
        throw new Error('test throw')
    }catch(err){
        console.warn('err',err)
    }

    return 'ok'
}

testES5('for')