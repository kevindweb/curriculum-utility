import * as React from 'react';
const squareStyle = {
    width: '100%',
    height: '100%',
};
export const Square = ({ children }: any) => {
    const color = 'white'
    return (<div style={{
        ...squareStyle,
        color
    }}>
			{children}
		</div>);
};

