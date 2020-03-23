
/**
 * ----------- Polls form -------------------------------------------
 */

const addOptionButton = document.getElementById("add-option-button");
const pollFormOptions = document.getElementById("poll-form-options");

/**
 * @name addOptionHandler
 * @description Add new option to poll options form.
 */
const addOptionHandler = () => {
  const newOption = document.createElement("input");
        newOption.type = "text";
        newOption.placeholder = "Enter poll option";
        newOption.name = "options";
        newOption.value = "";
  
  pollFormOptions.appendChild(newOption);
}

addOptionButton.onclick = addOptionHandler;


