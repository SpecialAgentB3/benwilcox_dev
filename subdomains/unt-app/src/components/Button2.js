import React from 'react';

function Button2(props){
    const clickButton = () => {
        console.log(props.message);
        // <h1>The message is {props.message}</h1>
    }

    return(
        <button onClick={() => clickButton()}>joink</button>
    );
}

export default Button2