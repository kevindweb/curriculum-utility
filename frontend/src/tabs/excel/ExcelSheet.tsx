import * as React from 'react';
import Semesters from './Semesters';

export default function ExcelSheet() {
    return (
        <div>
            <h1>Curriculum Summary</h1>
	        <h2 style = {{textAlign: "center"}}>Welcome to the new Curriculum Summary page! </h2>
            <h3 style = {{paddingLeft:50, paddingRight:50}}>
            This page is designed to help you plan your path to graduation by ensuring you meet all of your graduation requirements. To mesh with the current excel sheet system all requirements will remain in their "suggested semester" based on the university's suggested order. Updates to this page will be reflected on you planning Tree and vice versa. To use this page right click on the location where you would like to add or remove the course in question, then use the drop-down menu to add a grade. If you wish to change a curriculum requirements assignment of a course, simply click and drag the course to the requirement you want. Note that you cannot remove or change non-elective courses as the University requires these to be taken for you to graduate. Also note that this system is NOT directly linked to your BanWeb account and therefore entirely relies on your accurate input of your information.
            </h3>
   	        <Semesters /> 
        </div>
    )
}
