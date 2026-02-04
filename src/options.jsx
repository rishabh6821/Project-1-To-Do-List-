import App from "./App";

let options = [
    "Show works to do",
    "Show completed works",
    "Show all works"
];


function SelectOption() {
  return (
    <>
      <div className="App-structure">
        <ul type="none">
            {
                options.map((option, index) => (
                    <li key={index}><button className="ChoosenOnesBtns" onClick={() => chosenArray(index)}>{option}</button></li>
                ))
            }
        </ul>  
      </div>
    </>
  );
}

export default SelectOption;