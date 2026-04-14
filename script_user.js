// ==UserScript==
// @name         MZ Colorized Skills (Mobile Version)
// @namespace    http://tampermonkey.net/
// @version      0.29
// @description  Colorize Managerzone players skills valid for mobile versions
// @author       xente
// @contributor  vanjoge (https://greasyfork.org/es/users/220102-vanjoge)
// @match        https://www.managerzone.com/*
// @icon         https://statsxente.com/MZ1/View/Images/main_icon.png
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @license      GNU
// @downloadURL https://update.greasyfork.org/scripts/536714/MZ%20Colorized%20Skills%20%28Mobile%20Version%29.user.js
// @updateURL https://update.greasyfork.org/scripts/536714/MZ%20Colorized%20Skills%20%28Mobile%20Version%29.meta.js
// ==/UserScript==

// Based in the vanjoge original script: https://greasyfork.org/es/scripts/373382-van-mz-playeradvanced
// Thanks vanjoge for the original code!

(function() {
    'use strict';

    let defaults = {
        soccer_ball_width: 12, soccer_ball_height: 10,
        hockey_puck_width: 12, hockey_puck_height: 10,
    };
    Object.entries(defaults).forEach(([k, v]) => {
        if (GM_getValue(k) === undefined) GM_setValue(k, v);
    });

    let btn = document.createElement("button");
    btn.style.display = "none";
    btn.id = "stxc_colorize_skills_mobile";
    document.body.appendChild(btn);
    btn.addEventListener("click", function () {
        colorizeSkills().then()
    });

    let training_icon="data:image/gif;base64,R0lGODlhBgAKAJEDAJnMZpmZmQAAAP///yH5BAEAAAMALAAAAAAGAAoAAAIRXCRhApAMgoPtVXXS2Lz73xUAOw=="
    let test_image="data:image/gif;base64,R0lGODlhDAAKAJEDAP////8AAMyZmf///yH5BAEAAAMALAAAAAAMAAoAAAIk3BQZYp0CAAptxvjMgojTEVwKpl0dCQrQJX3T+jpLNDXGlDUFADs=";
    let test_image_hockey="data:image/gif;base64,R0lGODlhDAAKANUkAOXq//8pKunt//ZTVPz19dXZ+tzk/+NAV+bl+Ojs//4wMeWkreXp/f4tLvRMT+Dm/+Xr/7lra/4vMepKSv7///ZRUvz8/tmHhs/Z/+xKSfVeYNCJkfhFRPUxOuBUZvRsb9ri//39//hDQv8oKf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACQALAAAAAAMAAoAAAZCQBLpMhqJMgiLkEQoOkeDwnLzdIowwuoTlNUWDRSSF/oIkUQBZ6BRAWiEkIlopPgsEhzPMgIQCBgOEiNLQh1PB4RBADs="
    let maxed_imgs = new Map();
    maxed_imgs.set('maxed_soccer', "<img alt='' width='"+GM_getValue('soccer_ball_width')+"' height='"+GM_getValue('soccer_ball_height')+"' src='data:image/gif;base64,R0lGODlhDAAKAJEDAP////8AAMyZmf///yH5BAEAAAMALAAAAAAMAAoAAAIk3BQZYp0CAAptxvjMgojTEVwKpl0dCQrQJX3T+jpLNDXGlDUFADs='/>");
    maxed_imgs.set('unmaxed_soccer', "<img alt='' width='"+GM_getValue('soccer_ball_width')+"' height='"+GM_getValue('soccer_ball_height')+"' src='data:image/gif;base64,R0lGODlhDAAKAJEDAP///8zM/wAA/////yH5BAEAAAMALAAAAAAMAAoAAAIk3CIpYZ0BABJtxvjMgojTIVwKpl0dCQbQJX3T+jpLNDXGlDUFADs='/>");
    maxed_imgs.set('maxed_hockey', "<img alt='' width='"+GM_getValue('hockey_puck_width')+"' height='"+GM_getValue('hockey_puck_height')+"' src='data:image/gif;base64,R0lGODlhDAAKANUkAOXq//8pKunt//ZTVPz19dXZ+tzk/+NAV+bl+Ojs//4wMeWkreXp/f4tLvRMT+Dm/+Xr/7lra/4vMepKSv7///ZRUvz8/tmHhs/Z/+xKSfVeYNCJkfhFRPUxOuBUZvRsb9ri//39//hDQv8oKf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACQALAAAAAAMAAoAAAZCQBLpMhqJMgiLkEQoOkeDwnLzdIowwuoTlNUWDRSSF/oIkUQBZ6BRAWiEkIlopPgsEhzPMgIQCBgOEiNLQh1PB4RBADs='/>");
    maxed_imgs.set('unmaxed_hockey', "<img alt='' width='"+GM_getValue('hockey_puck_width')+"' height='"+GM_getValue('hockey_puck_height')+"' src='data:image/gif;base64,R0lGODlhDAAKALMNAOnt/+Xr/9ri/6/A/6G1/73L/52x/8/Z/4Wf/32Z/1x9/0Rr/x9N/////wAAAAAAACH5BAEAAA0ALAAAAAAMAAoAAAQwsDXD2FJB6sot0UnHLYckdoJ5VmmzWoi0nAuxSIEyW0qxJBrFAAAYKCoaSYgD1EQAADs='/>");

    let colors = new Map();
    colors.set('skc_4', '#ff00ff');
    colors.set('skc_3', '#0000ff');
    colors.set('skc_2', '#b8860b');
    colors.set('skc_1', '#ff0000');


    const observer = new MutationObserver((mutations) => {
        const changed = mutations.some((mutation) =>
                mutation.addedNodes.length > 0 && (
                    mutation.target.id === "players_container" ||
                    [...mutation.addedNodes].some(node =>
                            node.classList && (
                                node.classList.contains("playerContainer") ||
                                node.classList.contains("player_loading_div")
                            )
                    ) ||
                    [...mutation.addedNodes].some(node =>
                        node.querySelector?.('.player_loading_div')
                    )
                )
        );
        if (changed && !document.getElementById("players_container_stx")) {
            console.log("----Event Colors----")
            waitToDOM(colorizeSkills, ".playerContainer", 0,7000);
        }
    });
    const el = document.getElementById("players_container");
    if (el) observer.observe(el, { childList: true, subtree: true });

    setSport()
    setDeviceFormat()
    waitToDOM(colorizeSkills, ".playerContainer", 0,7000)

    document.addEventListener('click', function(event) {
        const link = event.target.closest('.player_link'); // Busca el ancestro más cercano con esa clase
        if (link) {
            waitToDOM(colorizeSkills, ".playerContainer", 0,7000)
        }
    });

//Colorize on market
    async function colorizeSkillsOnMarket(){
        let players = document.querySelectorAll(".playerContainer");
        players.forEach(p => {
            let scout = p.querySelectorAll(".scout_report_row.box_dark");
            let hp_stars=0;
            let lp_stars=0;
            let sp_stars=0
            if(scout.length>0){

                let scout_divs = p.querySelectorAll(".scout_report_stars");

                hp_stars = scout_divs[0].querySelectorAll("i").length;
                lp_stars = scout_divs[1].querySelectorAll("i").length;
                sp_stars = scout_divs[2].querySelectorAll("i").length;


            }


            let skill_vals= p.querySelectorAll(".skillval");


            let hp_skills=[]
            let lp_skills=[]
            let hp_text=""

            skill_vals.forEach(skill => {


                let skillValue = skill.querySelectorAll("span")
                let valor = parseInt(skillValue[0].innerHTML, 10);
                let dataToInsert = '<div class="skill" style="white-space: nowrap; font-size:0;padding: 0 0 0 4px;">'
                for (let i = 0; i < valor; i++) {
                    if (skillValue[0].classList.contains('maxed')) {
                        dataToInsert += maxed_imgs.get('maxed_'+window.sport)
                    } else {
                        dataToInsert += maxed_imgs.get('unmaxed_'+window.sport)
                    }

                }

                let balls_td = skill.previousElementSibling;
                let skill_name_td=skill.previousElementSibling.previousElementSibling;
                if(scout.length>0){
                    let spans=skill_name_td.querySelector("span")
                    let spans_name=spans.querySelector("span")
                    if(skill_name_td.querySelector("span.sup")){

                        if(skill_name_td.querySelector("span.sup").textContent==="1"){
                            skill_name_td.style.color=colors.get("skc_"+hp_stars)
                            skill_name_td.style.fontWeight = "bold"
                            hp_skills.push(spans_name.textContent)
                        }

                        if(skill_name_td.querySelector("span.sup").textContent==="2"){
                            skill_name_td.style.color=colors.get("skc_"+lp_stars)
                            lp_skills.push(spans_name.textContent)
                        }
                    }
                }

                if(hp_skills.length>0){
                    hp_text="[H"+hp_stars+" "+hp_skills[0]+","+hp_skills[1]+"] "+"[L"+lp_stars+" "+lp_skills[0]+","+lp_skills[1]+"] S"+sp_stars
                }
                balls_td.querySelector("#container").innerHTML=dataToInsert

            });
            let player_h2 = p.querySelectorAll("span.player_name")
            if(!player_h2[0].innerHTML.includes("]")){
                player_h2[0].innerHTML=player_h2[0].innerHTML+" "+'<span class="stxc_scout" style="white-space: break-spaces; font-weight:normal;">'+hp_text+'</span>'
            }

        });



    }
//Colorize other pages
    async function colorizeSkills() {
        let params = new URLSearchParams(window.location.search);
        let type="players"
        if (params.get('p') === 'transfer') {
            type="market"
        }

        if(type==="market"){
            colorizeSkillsOnMarket().then()
            return;

        }

        let playerDivs = document.querySelectorAll('div.playerContainer');
        playerDivs.forEach((div, divIndex) => {
            let tableIndex=0;
            if( window.stxc_device_mobile==="mobile"){
                tableIndex=1;
            }

            let spanClass="clippable"
            let skillsTable = playerDivs[divIndex].querySelectorAll('table.player_skills.player_skills_responsive');
            if(type==="market"){
                skillsTable = playerDivs[divIndex].querySelectorAll('table.player_skills.player_skills_transfer');
                tableIndex=0;
                spanClass="skill_name"
            }

            let span_id = playerDivs[divIndex].querySelectorAll("span.player_id_span")
            let player_id = span_id[0].innerHTML
            let h2 = playerDivs[divIndex].querySelectorAll("h2.subheader.clearfix")
            let stxc_class=h2[0].querySelectorAll("span.stxc_scout");

            if((stxc_class.length===0)&&(skillsTable.length>0)){
                let filas = skillsTable[tableIndex].querySelectorAll('tr');
                let contSkill = 0
                let maxIndex=11;
                if(window.sport==="hockey"){
                    contSkill=-1;
                    maxIndex=10;
                }


                filas.forEach((fila, i) => {
                    if ((contSkill>-1)&&(contSkill < maxIndex)) {
                        let divContainer = fila.querySelector('div#container');
                        let hiddenDiv = divContainer.querySelectorAll('img.skill');
                        hiddenDiv[0].style.display = 'none';


                        let skillval = fila.querySelectorAll('td.skillval');
                        let skillValue = skillval[0].querySelectorAll("span")

                        let valor = parseInt(skillValue[0].innerHTML, 10);
                        let dataToInsert = '<div class="skill" style="white-space: nowrap; font-size:0;padding: 0 0 0 4px;">'
                        for (let i = 0; i < valor; i++) {
                            if (skillValue[0].classList.contains('maxed')) {
                                dataToInsert += maxed_imgs.get('maxed_'+window.sport)
                            } else {
                                dataToInsert += maxed_imgs.get('unmaxed_'+window.sport)
                            }

                        }


                        if(divContainer.innerHTML.includes("blevel")){
                            dataToInsert +='<img alt="" src="'+training_icon+'"/>'
                        }


                        dataToInsert += +'</div>'

                        divContainer.innerHTML += dataToInsert

                        if( window.stxc_device_mobile==="mobile"){

                            //divContainer.style.marginRight="-3px"
                        }


                        let primeraCelda = fila.querySelectorAll('td');

                        let skillName = primeraCelda[0].querySelectorAll("span."+spanClass)
                        let idValue
                        if(skillName.length>0){
                            idValue=skillName[0].innerHTML
                        }else{
                            skillName = primeraCelda[0].querySelectorAll("span.skill_name")
                            let spans_=skillName[0].querySelectorAll("span")
                            idValue=spans_[0].innerText

                        }

                        if(type==="market"){
                            let aux=skillName[0].querySelectorAll("span")
                            idValue=aux[0].textContent
                        }
                        skillName[0].id = idValue + "_" + player_id
                        if( window.stxc_device_mobile==="mobile"){
                            skillName[0].style.marginRight="-3px"
                            skillName[0].style.textAlign="left"
                        }


                    }
                    contSkill++
                });

            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://www.managerzone.com/ajax.php?p=players&sub=scout_report&pid=' + player_id + '&sport=' + window.sport,
                onload: function (responseDetailsScout) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(responseDetailsScout.responseText, 'text/html');
                    const aTags = doc.querySelectorAll('span.stars');
                    let index = 0
                    let hp_stars = 0
                    let lp_stars = 0
                    let ts_stars =0
                    aTags.forEach(tag => {
                        const is = tag.querySelectorAll('i');
                        is.forEach(i => {
                            if (index <= 3) {
                                if (i.className === "fa fa-star fa-2x lit") {
                                    hp_stars++;
                                }
                            }


                            if (index > 3 && index <= 7) {
                                if (i.className === "fa fa-star fa-2x lit") {
                                    lp_stars++;
                                }
                            }

                            if (index > 7) {
                                if (i.className === "fa fa-star fa-2x lit") {
                                    ts_stars++
                                }
                            }

                            index++;
                        });

                    });



                    let hp_value,hp_value1,lp_value,lp_value1

                    const uls = doc.querySelectorAll('ul');
                    index = 0;
                    uls.forEach(ul => {
                            let lis = ul.querySelectorAll('li');
                            if (lis.length > 2) {
                                let stars_value
                                let spanIndex = 0;
                                let spans1 = lis[1].querySelectorAll('span')
                                let spans2 = lis[2].querySelectorAll('span')
                                if (spans1.length > 1) {
                                    spanIndex = 1
                                }
                                if (index === 0) {
                                    stars_value = hp_stars
                                    hp_value=spans1[spanIndex].textContent
                                    hp_value1=spans2[spanIndex].textContent
                                    if(skillsTable.length>0){
                                        document.getElementById(spans1[spanIndex].textContent + "_" + player_id).style.fontWeight = "bold"
                                        document.getElementById(spans2[spanIndex].textContent + "_" + player_id).style.fontWeight = "bold"
                                    }
                                } else {
                                    stars_value = lp_stars
                                }
                                lp_value=spans1[spanIndex].textContent
                                lp_value1=spans2[spanIndex].textContent
                                if(skillsTable.length>0){
                                    document.getElementById(spans1[spanIndex].textContent + "_" + player_id).style.color = colors.get("skc_" + stars_value)
                                    document.getElementById(spans2[spanIndex].textContent + "_" + player_id).style.color = colors.get("skc_" + stars_value)
                                }
                                index++
                            }

                        }
                    );

                    let as = h2[0].querySelectorAll("a.subheader")
                    if((stxc_class.length===0)&&(hp_value1!==undefined)){
                        if( window.stxc_device_mobile==="mobile"){
                            h2[0].innerHTML+='<span class="stxc_scout" style="font-size: smaller; white-space: nowrap;"> [H'+hp_stars+' '+hp_value+','+hp_value1+'] [L'+lp_stars+' '+lp_value+','+lp_value1+'] S'+ts_stars+'</span>'
                        }else{
                            let newSpan = document.createElement('span');
                            newSpan.className="stxc_scout"
                            newSpan.style.whiteSpace = "nowrap";
                            newSpan.innerHTML = ' [H'+hp_stars+' '+hp_value+','+hp_value1+'] [L'+lp_stars+' '+lp_value+','+lp_value1+'] S'+ts_stars
                            as[0].insertAdjacentElement('afterend',newSpan);
                        }
                    }else{
                        let newSpan = document.createElement('span');
                        newSpan.className="stxc_scout"
                        newSpan.style.display = "none";
                        as[0].insertAdjacentElement('afterend',newSpan);
                    }



                }
            });

        });

    }


///UTILS////
    function setSport(){

        let sportCookie=getSportByMessenger()
        if(sportCookie===""){
            sportCookie = getCookie("MZSPORT");
        }
        if(sportCookie===""){
            sportCookie=getSportByLink()
        }
        if(sportCookie===""){
            sportCookie=getSportByScript()
        }

        window.sport = sportCookie;


    }
    function setDeviceFormat(){
        if(!document.getElementById("deviceFormatStx")){
            let script = document.createElement('script');
            script.textContent = `
        let newElemenDevicestxc_mobile = document.createElement("input");
        newElemenDevicestxc_mobile.id= "deviceFormatstxc_mobile";
        newElemenDevicestxc_mobile.type = "hidden";
        newElemenDevicestxc_mobile.value=window.device;
        document.body.appendChild(newElemenDevicestxc_mobile);

`;
            document.documentElement.appendChild(script);
            script.remove();
            window.stxc_device_mobile=document.getElementById("deviceFormatstxc_mobile").value
        }
        //window.stxc_device_mobile="mobile";
    }
    function getSportByMessenger() {
        if (document.getElementById("messenger")) {

            if ((document.getElementById("messenger").className === "soccer") || (document.getElementById("messenger").className === "hockey")) {
                return document.getElementById("messenger").className
            }
        }
        return ""
    }
    function getSportByLink(){
        let element = document.getElementById("settings-wrapper");
        if (element) {
            let firstLink = element.getElementsByTagName("a")[0];
            if (firstLink) {
                if(firstLink.href.includes("soccer")){
                    return "hockey"
                }else{
                    return "soccer"
                }
            }
        }
    }
    function getSportByScript(){
        const script = document.createElement('script');
        script.textContent = `
        var newElement = document.createElement("input");
        newElement.id= "stxc_sport";
        newElement.type = "hidden";
        newElement.value=window.ajaxSport;
        let body = document.body;
        body.appendChild(newElement);

`;
        document.documentElement.appendChild(script);
        script.remove();
        return document.getElementById("stxc_sport").value
    }
    function getCookie(nombre) {
        let regex = new RegExp("(?:(?:^|.*;\\s*)" + nombre + "\\s*\\=\\s*([^;]*).*$)|^.*$");
        let valorCookie = document.cookie.replace(regex, "$1");
        return decodeURIComponent(valorCookie);
    }
    function createModalMenu() {
        const style = document.createElement('style');
        style.textContent = `

        .stxc_legend {
    z-index:300;
    position: fixed;
    bottom: 65%;
    right: 1px;
    border: 1px solid #2bacf5;
  padding-right: 13px;
    padding-left: 3px;
    padding-top: 3px;
     padding-bottom: 3px;
    width: 14px;
    font-size: 13px;
    border-radius: 4px;
    text-shadow: 1px 1px 3px #676767;
    background-color: #efb52f;
    color: #246355;
    cursor: default;
         cursor: pointer;
}


    #stxc-overlay {
        display: none; position: fixed; inset: 0; z-index: 99998;
        background: rgba(0,0,0,0.45);
        align-items: center; justify-content: center;
    }
    #stxc-overlay.open { display: flex; }
    .stxc-modal {
        background: #fff; border-radius: 12px; overflow: hidden;
        width: 90%; max-width: 480px; max-height: 90vh;
        overflow-y: auto; font-family: system-ui, sans-serif;
    }
    .stxc-header {
        background: #f5c800; padding: 12px 16px;
        display: flex; align-items: center; justify-content: space-between;
        position: sticky; top: 0; z-index: 1;
    }
    .stxc-header span { font-size: 15px; font-weight: 600; color: #3a2e00; }
    .stxc-close {
        width: 28px; height: 28px; border-radius: 50%;
        background: #fff; border: none; cursor: pointer;
        font-size: 14px; color: #555; display: flex;
        align-items: center; justify-content: center;
    }
    .stxc-section { padding: 12px 16px; border-bottom: 1px solid #e5e5e5; }
    .stxc-section-title {
        font-size: 10px; font-weight: 600; color: #999;
        text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px;
    }
    .stxc-slider-row { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
    .stxc-slider-row label { font-size: 12px; color: #888; white-space: nowrap; min-width: 40px; }
    .stxc-slider-row input[type=range] { flex: 1; accent-color: #f5c800; }
    .stxc-slider-val { font-size: 12px; color: #555; min-width: 36px; }
    .stxc-preview-box {
        width: 80px; height: 80px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        background: #f5f5f5; border-radius: 8px;
    }
    .stxc-section-inner { display: flex; align-items: center; gap: 24px; }
    .stxc-sliders { flex: 1; }
    .stxc-footer { padding: 12px 16px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .stxc-btn {
        padding: 7px 16px; border-radius: 7px; border: none;
        font-size: 13px; font-weight: 500; cursor: pointer;
    }
    .stxc-btn-green  { background: #4caf50; color: #fff; }
    .stxc-btn-red    { background: #f44336; color: #fff; }
    `;
        document.head.appendChild(style);

        const defaults = {
            soccer_ball_width: 12, soccer_ball_height: 10,
            hockey_puck_width: 12, hockey_puck_height: 10,
        };
        Object.entries(defaults).forEach(([k, v]) => {
            if (GM_getValue(k) === undefined) GM_setValue(k, v);
        });

        const legendDiv = document.createElement('div');
        legendDiv.id = 'legendDivStxc';
        legendDiv.className = 'stxc_legend';
        legendDiv.innerHTML = '<div style="writing-mode: tb-rl; -webkit-writing-mode: vertical-rl; margin: 0 auto; text-align:center;"><img alt="" src="https://statsxente.com/MZ1/View/Images/main_icon.png" style="width:25px;height:25px;"/></div>';
        document.body.appendChild(legendDiv);

        const overlay = document.createElement('div');
        overlay.id = 'stxc-overlay';

        let html = '<div class="stxc-modal">';
        html += `<div class="stxc-header"><span>Image Size Config</span><button class="stxc-close" id="stxcClose">✕</button></div>`;

        // Soccer ball section
        html += `
    <div class="stxc-section">
        <div class="stxc-section-title">Soccer ball</div>
        <div class="stxc-section-inner">
            <div class="stxc-sliders">
                <div class="stxc-slider-row">
                    <label>Width</label>
                    <input type="range" min="5" max="20" step="1" value="${GM_getValue('soccer_ball_width')}" id="soccer_w">
                    <span class="stxc-slider-val" id="soccer_w_val">${GM_getValue('soccer_ball_width')}px</span>
                </div>
                <div class="stxc-slider-row">
                    <label>Height</label>
                    <input type="range" min="5" max="20" step="1" value="${GM_getValue('soccer_ball_height')}" id="soccer_h">
                    <span class="stxc-slider-val" id="soccer_h_val">${GM_getValue('soccer_ball_height')}px</span>
                </div>
            </div>
            <div class="stxc-preview-box">
                <img alt='' id="soccer_preview" src="${test_image}" style="width:${GM_getValue('soccer_ball_width')}px; height:${GM_getValue('soccer_ball_height')}px;">
            </div>
        </div>
    </div>`;

        // Hockey puck section
        html += `
    <div class="stxc-section">
        <div class="stxc-section-title">Hockey puck</div>
        <div class="stxc-section-inner">
            <div class="stxc-sliders">
                <div class="stxc-slider-row">
                    <label>Width</label>
                    <input type="range" min="5" max="20" step="1" value="${GM_getValue('hockey_puck_width')}" id="hockey_w">
                    <span class="stxc-slider-val" id="hockey_w_val">${GM_getValue('hockey_puck_width')}px</span>
                </div>
                <div class="stxc-slider-row">
                    <label>Height</label>
                    <input type="range" min="5" max="20" step="1" value="${GM_getValue('hockey_puck_height')}" id="hockey_h">
                    <span class="stxc-slider-val" id="hockey_h_val">${GM_getValue('hockey_puck_height')}px</span>
                </div>
            </div>
            <div class="stxc-preview-box">
                <img alt='' id="hockey_preview" src="${test_image_hockey}" style="width:${GM_getValue('hockey_puck_width')}px; height:${GM_getValue('hockey_puck_height')}px;">
            </div>
        </div>
    </div>`;

        html += `
    <div class="stxc-footer">
        <button class="stxc-btn stxc-btn-green" id="saveButtonSTXC">Save</button>
        <button class="stxc-btn stxc-btn-red" id="resetButtonSTXC">Reset</button>
    </div>`;

        html += '</div>';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        // Sliders
        document.getElementById('soccer_w').addEventListener('input', function() {
            document.getElementById('soccer_w_val').textContent = this.value + 'px';
            document.getElementById('soccer_preview').style.width = this.value + 'px';
        });
        document.getElementById('soccer_h').addEventListener('input', function() {
            document.getElementById('soccer_h_val').textContent = this.value + 'px';
            document.getElementById('soccer_preview').style.height = this.value + 'px';
        });
        document.getElementById('hockey_w').addEventListener('input', function() {
            document.getElementById('hockey_w_val').textContent = this.value + 'px';
            document.getElementById('hockey_preview').style.width = this.value + 'px';
        });
        document.getElementById('hockey_h').addEventListener('input', function() {
            document.getElementById('hockey_h_val').textContent = this.value + 'px';
            document.getElementById('hockey_preview').style.height = this.value + 'px';
        });

        // Open/close
        legendDiv.addEventListener('click', () => overlay.classList.toggle('open'));
        document.getElementById('stxcClose').addEventListener('click', () => overlay.classList.remove('open'));
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

        // Save
        document.getElementById('saveButtonSTXC').addEventListener('click', () => {
            GM_setValue('soccer_ball_width',  parseInt(document.getElementById('soccer_w').value));
            GM_setValue('soccer_ball_height', parseInt(document.getElementById('soccer_h').value));
            GM_setValue('hockey_puck_width',  parseInt(document.getElementById('hockey_w').value));
            GM_setValue('hockey_puck_height', parseInt(document.getElementById('hockey_h').value));
            window.location.reload();
        });

        // Reset
        document.getElementById('resetButtonSTXC').addEventListener('click', () => {
            ['soccer_ball_width','soccer_ball_height','hockey_puck_width','hockey_puck_height']
                .forEach(k => GM_deleteValue(k));
            window.location.reload();
        });
    }
    function waitToDOM(function_to_execute, classToSearch, elementIndex,miliseconds) {
        let interval = setInterval(function () {
            let elements = document.querySelectorAll(classToSearch);
            if (elements.length > 0 && elements[elementIndex]) {
                clearInterval(interval);
                clearTimeout(timeout);
                function_to_execute();
            }
        }, 100);


        let timeout = setTimeout(function () {
            clearInterval(interval);
        }, miliseconds);
    }

    setTimeout(function () {

        createModalMenu();
        if(document.getElementById("alert_stx_image")){
            document.getElementById("legendDivStxc").style.bottom="67%"
        }
    }, 2000);

})();
