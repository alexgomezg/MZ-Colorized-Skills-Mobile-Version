// ==UserScript==
// @name         MZ Colorized Skills (Mobile Version)
// @namespace    http://tampermonkey.net/
// @version      0.61
// @description  Colorize Managerzone players skills valid for mobile versions
// @author       xente
// @contributor  vanjoge (https://greasyfork.org/es/users/220102-vanjoge)
// @match        https://www.managerzone.com/*
// @connect      managerzone.com
// @icon         https://statsxente.com/MZ1/View/Images/main_icon.png
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @license      GNU
// @downloadURL https://update.greasyfork.org/scripts/536714/MZ%20Colorized%20Skills%20%28Mobile%20Version%29.user.js
// @updateURL https://update.greasyfork.org/scripts/536714/MZ%20Colorized%20Skills%20%28Mobile%20Version%29.meta.js
// ==/UserScript==

// Based in the vanjoge original script: https://greasyfork.org/es/scripts/373382-van-mz-playeradvanced
// Thanks vanjoge for the original code!

(function() {
    'use strict';
    let captureMatchLoader = false;
    let mlTimer = null;
    let skillIndex
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
        colorizeSkills("none").then()
    });

    let btn1 = document.createElement("button");
    btn1.style.display = "none";
    btn1.id = "stxc_colorize_skills_mobile_transfers";
    document.body.appendChild(btn1);
    btn1.addEventListener("click", function () {
        colorizeSkillsOnMarket()
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
            waitToDOM(colorizeSkills, ".playerContainer", 0,7000);
        }
    });
    const el = document.getElementById("players_container");
    if (el) observer.observe(el, { childList: true, subtree: true });
    setSport()
    setDeviceFormat()
    GM_setValue("players_maxs_" + window.sport,"[]");
    let player_maxs_map = new Map(JSON.parse(GM_getValue("players_maxs_"+window.sport, "[]")));
    let params = new URLSearchParams(window.location.search);
    if (params.get('p') === 'tactics') {
        waitToDOM(colorizeSkills, ".buttonClassRight", 0,7000)
    }
    if (params.get('p') === 'match') {
        waitToDOM(insertCopyXMLEventListener,".scoreboard_container",0,7000)
    }

    waitToDOM(colorizeSkills, ".playerContainer", 0,7000)
    document.addEventListener('click', function(event) {
        const link = event.target.closest('.player_link');
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
                if(window.stxc_device_mobile==="mobile"){
                    skill_name_td.querySelector('.skill_name').style.marginRight="-3px"
                    skill_name_td.querySelector('.skill_name').style.justifyContent="start";
                }


                if(hp_skills.length>0){
                    hp_text="[H"+hp_stars+" "+hp_skills[0]+","+hp_skills[1]+"] "+"[L"+lp_stars+" "+lp_skills[0]+","+lp_skills[1]+"] S"+sp_stars
                }
                balls_td.querySelector("#container").innerHTML=dataToInsert

            });
            let player_h2 = p.querySelectorAll("span.player_name")
            let player_id = p.querySelector("span.player_id_span")?.innerHTML ?? null;
            window.stxc_device_mobile="mobile"
            if(player_id!==null){
                if((!document.getElementById('stxc_id_'+player_id))&&(GM_getValue("hpVis") )){
                    if( window.stxc_device_mobile==="mobile"){
                        let h2 = p.querySelectorAll("h2.subheader.clearfix")
                        let as = h2[0].querySelectorAll("span.floatRight")
                        //let txt='<span id="stxc_id_'+player_id+'" class="stxc_scout" style="overflow: hidden; text-overflow: ellipsis; font-weight: normal; font-size: 100%; white-space: nowrap;"> '+hp_text+'</span>'
                        let txt='<span id="stxc_id_'+player_id+'" class="stxc_scout" style="min-width: 0; flex: 0 1 auto; overflow: hidden; text-overflow: ellipsis; font-weight: normal; font-size: 100%; white-space: pre;"> '+hp_text+'</span>'
                        as[0].insertAdjacentHTML('afterend',txt)
                    }else{
                        let as = player_h2[0].querySelectorAll("a.subheader")
                        let newSpan = document.createElement('span');
                        newSpan.className="stxc_scout"
                        newSpan.style.whiteSpace = "nowrap";
                        newSpan.style.fontSize="100%"
                        newSpan.style.fontWeight="normal"
                        newSpan.innerHTML = ' '+hp_text
                        newSpan.id='stxc_id_'+player_id
                        player_h2[0].insertAdjacentElement('afterend',newSpan);
                    }

                }
            }


        });



    }
//Colorize other pages
    async function colorizeSkills(type_= "none"){
        let params = new URLSearchParams(window.location.search);
        let type="players"
        if(type_==="none"){
            if (params.get('p') === 'transfer') {
                type="market"
            }

            if (params.get('p') === 'shortlist') {
                type="shortlist"
            }

            if(type==="market"){
                colorizeSkillsOnMarket().then()
                return;
            }

            if(params.get('p')==="tactics"){
                let target = document.querySelector(".player-info-content");
                colorizeSkillsOnTactics().then()
                return;
            }
        }else{
            type=type_
        }



        if((type==="players")&&(document.getElementById('filterSubmit'))){
            document.getElementById('filterSubmit').addEventListener('click', function() {
                setTimeout(function () {
                    waitToDOM(colorizeSkills, ".playerContainer", 0,7000)
                }, 2000);
            });
        }

        let player_maxs
        let players = document.querySelectorAll(".playerContainer");
        for (const p of players) {
            let id=p.querySelector('span.player_id_span').textContent
            let classDiv=".player_skills.player_skills_responsive"
            let divIndex=0;
            if(window.stxc_device_mobile==="mobile"){
                classDiv=".player_skills.player_skills_responsive"
                divIndex=1;
            }
            let div=p.querySelectorAll(classDiv);

            let skill_vals=[]
            if (div.length>0){
                skill_vals= div[divIndex].querySelectorAll(".skillval");
            }
            if(type==="shortlist"){
                if(skill_vals.length>0){
                    player_maxs=await fetchPlayerTableSkills(id)
                }
            }
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





            let hp_skills=[]
            let lp_skills=[]
            let hp_text=""
            let contIndexSkill=0;
            skill_vals= p.querySelectorAll(".skillval");
            skill_vals.forEach(skill => {
                let balls_td = skill.previousElementSibling;
                let divContainer = balls_td.querySelector('div#container');
                let skillValue = skill.querySelectorAll("span")
                let valor = parseInt(skillValue[0].innerHTML, 10);
                let dataToInsert = '<div class="skill" style="white-space: nowrap; font-size:0;padding: 0 0 0 4px;">'

                for (let i = 0; i < valor; i++) {
                    if(type==="shortlist"){
                        if (player_maxs.maxs[contIndexSkill]==="maxed") {
                            dataToInsert += maxed_imgs.get('maxed_'+window.sport)
                        } else {
                            dataToInsert += maxed_imgs.get('unmaxed_'+window.sport)
                        }
                    }else{
                        if (skillValue[0].classList.contains('maxed')) {
                            dataToInsert += maxed_imgs.get('maxed_'+window.sport)
                        } else {
                            dataToInsert += maxed_imgs.get('unmaxed_'+window.sport)
                        }
                    }
                }
                contIndexSkill++;

                if((window.sport=="hockey")&&(contIndexSkill==11)){
                    contIndexSkill=0;
                }

                if((window.sport=="soccer")&&(contIndexSkill==13)){
                    contIndexSkill=0;
                }



                if(divContainer.innerHTML.includes("blevel")){
                    dataToInsert +='<img alt="" src="'+training_icon+'"/>'
                }

                let fila = skill.closest('tr');
                let skill_name_td = fila.querySelector('.skill_name span').closest('td');;
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
                if( window.stxc_device_mobile==="mobile"){
                    fila.querySelector('.skill_name').style.marginRight="-3px"
                    fila.querySelector('.skill_name').style.justifyContent="start";
                }

                if(hp_skills.length>0){
                    hp_text="[H"+hp_stars+" "+hp_skills[0]+","+hp_skills[1]+"] "+"[L"+lp_stars+" "+lp_skills[0]+","+lp_skills[1]+"] S"+sp_stars
                }
                balls_td.querySelector("#container").innerHTML=dataToInsert


            });
            let player_h2 = p.querySelectorAll("span.player_name")
            let player_id = p.querySelector("span.player_id_span")?.innerHTML ?? null;
            if(player_id!==null){
                if((!document.getElementById('stxc_id_'+player_id))&&(GM_getValue("hpVis") )){
                    if( window.stxc_device_mobile==="mobile"){
                        let h2 = p.querySelectorAll("h2.subheader.clearfix")
                        let as = h2[0].querySelectorAll("span.floatRight")
                        let txt='<span id="stxc_id_'+player_id+'" class="stxc_scout" style="overflow: hidden; text-overflow: ellipsis; font-weight: normal; font-size: 100%; white-space: nowrap;"> '+hp_text+'</span>'
                        as[0].insertAdjacentHTML('afterend',txt)
                    }else{
                        let as = player_h2[0].querySelectorAll("a.subheader")
                        let newSpan = document.createElement('span');
                        newSpan.className="stxc_scout"
                        newSpan.style.whiteSpace = "nowrap";
                        newSpan.style.fontSize="100%"
                        newSpan.style.fontWeight="normal"
                        newSpan.innerHTML = ' '+hp_text
                        newSpan.id='stxc_id_'+player_id
                        player_h2[0].insertAdjacentElement('afterend',newSpan);
                    }

                }
            }
        }

        if(type==="shortlist"){
            let now = new Date();
            let two_days = 2 * 24 * 60 * 60 * 1000;
            for (let [key, value] of player_maxs_map) {
                let date = new Date(value.date);
                if (now - date > two_days) {
                    player_maxs_map.delete(key);
                }
            }
        }


    }
    async function colorizeSkillsOnTactics(){
        let target = document.querySelector(".player-info-content");
        let observer = new MutationObserver(async (mutations) => {
            for (let mutation of mutations) {
                if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                    let skill_vals= target.querySelectorAll(".skillval");
                    skill_vals.forEach(skill => {


                        let skillValue = skill.querySelectorAll("span")
                        if(skillValue[0]===undefined)return;
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
                        balls_td.innerHTML=dataToInsert

                    });
                }
            }
        });

        observer.observe(target, {
            childList: true
        });

        colorizeSkills("players")


        /*let player_maxs
        let players = document.querySelectorAll(".playerContainer");
        for (const p of players) {
            let id=p.querySelector('span.player_id_span').textContent
            let skill_vals= p.querySelectorAll(".skillval");
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
            let hp_skills=[]
            let lp_skills=[]
            let hp_text=""
            let contIndexSkill=0;
            skill_vals.forEach(skill => {
                let balls_td = skill.previousElementSibling;
                let divContainer = balls_td.querySelector('div#container');
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
                contIndexSkill++;
                if(divContainer.innerHTML.includes("blevel")){
                    dataToInsert +='<img alt="" src="'+training_icon+'"/>'
                }
                let fila = skill.closest('tr');
                let skill_name_td = fila.querySelector('.skill_name span').closest('td');;
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
                if( window.stxc_device_mobile==="mobile"){
                    fila.querySelector('.skill_name').style.marginRight="-3px"
                    fila.querySelector('.skill_name').style.justifyContent="start";
                }

                if(hp_skills.length>0){
                    hp_text="[H"+hp_stars+" "+hp_skills[0]+","+hp_skills[1]+"] "+"[L"+lp_stars+" "+lp_skills[0]+","+lp_skills[1]+"] S"+sp_stars
                }
                balls_td.querySelector("#container").innerHTML=dataToInsert

            });

                let player_h2 = p.querySelectorAll("span.player_name")
            let player_id = p.querySelector("span.player_id_span").innerHTML
            if((!document.getElementById('stxc_id_'+player_id))&&(GM_getValue("hpVis") )){
                if( window.stxc_device_mobile==="mobile"){
                    let h2 = p.querySelectorAll("h2.subheader.clearfix")
                    let as = h2[0].querySelectorAll("span.floatRight")
                    let txt='<span id="stxc_id_'+player_id+'" class="stxc_scout" style="overflow: hidden; text-overflow: ellipsis; font-weight: normal; font-size: 100%; white-space: nowrap;"> '+hp_text+'</span>'
                    as[0].insertAdjacentHTML('afterend',txt)
                }else{
                    let as = player_h2[0].querySelectorAll("a.subheader")
                    let newSpan = document.createElement('span');
                    newSpan.className="stxc_scout"
                    newSpan.style.whiteSpace = "nowrap";
                    newSpan.style.fontSize="100%"
                    newSpan.style.fontWeight="normal"
                    newSpan.innerHTML = ' '+hp_text
                    newSpan.id='stxc_id_'+player_id
                    player_h2[0].insertAdjacentElement('afterend',newSpan);
                }

            }


        }*/
    }
//Copy XML
    function insertCopyXMLEventListener(){
        let links = document.querySelectorAll("a.matchIcon.large.shadow");
        links.forEach(function (link) {
            let icon = link.querySelector("i");
            if (icon && icon.textContent.trim() === "2D") {








                link.addEventListener("click", function (event) {
                    let overlay = document.getElementById('game-overlay-close');

                    let intervalId = setInterval(() => {
                        let style = window.getComputedStyle(overlay);
                        if (style.display === 'none') {


                            let div = document.getElementById("gameContent");
                            let button=""
                            //window.stxc_device_mobile="mobile"
                            if(window.stxc_device_mobile==="mobile"){
                                button = `

                            <button id="copyHome" class="btn-save"

                            style="position: fixed;
                            top: 50%; right: 5em;
                            transform: translateY(-50%);
                            z-index: 1000; border: 2px solid white;
                            color:white; background-color:#e4c800;
                            font-family: 'Roboto'; font-weight:bold;font-size:revert;
                            width:3em; padding: 2px 2px;">

                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house-door-fill" viewBox="0 0 16 16">
  <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/>
</svg>

                           Copy</button>



                            <button id="copyAway" class="btn-save"

                            style="position: fixed;
                            top: 60%; right: 5em;
                            transform: translateY(-50%);
                            z-index: 1000; border: 2px solid white;
                            color:white; background-color:#e4c800;
                            font-family: 'Roboto'; font-weight:bold;font-size:revert;
                            width:3em; padding: 2px 2px;">

                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-airplane-fill" viewBox="0 0 16 16">
  <path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849"/>
</svg>

                            Copy</button>

                            `
                            }else{

                                button = `</br>
                            </br>

                            <button id="copyHome" class="btn-save" style="border: 2px solid white; color:white; background-color:#e4c800; font-family: \'Roboto\'; font-weight:bold;font-size:revert; width:11em; padding: 2px 2px;">

                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-house-door-fill" viewBox="0 0 16 16">
  <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/>
</svg>

                           Copy Local Tactic</button>



                            <button id="copyAway" class="btn-save" style="border: 2px solid white; color:white; background-color:#e4c800; font-family: \'Roboto\'; font-weight:bold;font-size:revert; width:11em; padding: 2px 2px;">

                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-airplane-fill" viewBox="0 0 16 16">
  <path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849"/>
</svg>

                            Copy Away Tactic</button>

                            `

                            }

                            div.insertAdjacentHTML('beforeend', button);


                            let elemento = document.getElementById('copyHome');
                            elemento.addEventListener('click', function () {
                                copyXML(1636536511, true);
                            });

                            elemento = document.getElementById('copyAway');
                            elemento.addEventListener('click', function () {
                                copyXML(1636536511, false);
                            });

                            clearInterval(intervalId);
                        }
                    }, 750); //

                    event.preventDefault();
                    startCapture(loader => {
                        console.log("listo", loader)


                    });


                });

            }
        });
    }
//FETCH FUNCTIONS
    async function fetchPlayerTableSkills(player_id) {
        let link = "https://www.managerzone.com/?p=transfer&sub=players&u=" + player_id
        return new Promise((resolve, reject) => {
                if (player_maxs_map.has(player_id)) {
                    resolve(player_maxs_map.get(player_id));
                    return;
                }
                fetch(link, {
                    method: 'GET',
                    credentials: 'include'
                })
                    .then(response => response.text())
                    .then(async responseText => {
                        let parser = new DOMParser();
                        let doc = parser.parseFromString(responseText, 'text/html');
                        let player_container = doc.getElementById("thePlayers_0")
                        if (!player_container) {
                            let params = new URLSearchParams(window.location.search);
                            if (params.get('p') !== 'shortlist')return;
                            skillIndex =await trainingSkillsIndex()
                            let maxsMap=await getTrainingHistory(player_id)
                            let maxs = [...maxsMap.values()];
                            let obj = {id: player_id, maxs: maxs, date: new Date()}
                            player_maxs_map.set(player_id, obj)
                            GM_setValue("players_maxs_" + window.sport, JSON.stringify([...player_maxs_map]));
                            resolve(obj)
                            return;
                        }
                        let maxs = []
                        let divIndex=0;
                        let classDiv=".player_skills.player_skills_transfer"
                        if(window.stxc_device_mobile==="mobile"){
                            classDiv=".player_skills.player_skills_transfer"
                        }
                        let div = player_container.querySelectorAll(classDiv)


                        let skill_vals=[]
                        if (div.length>0){
                            skill_vals= div[divIndex].querySelectorAll(".skillval");
                        }


                        let cont = 0;
                        skill_vals.forEach(skill => {
                            let skillValue = skill.querySelectorAll("span")
                            let valor = parseInt(skillValue[0].innerHTML, 10);
                            let dataToInsert = '<div class="skill" style="white-space: nowrap; font-size:0;padding: 0 0 0 4px;">'
                            if (skillValue[0].classList.contains('maxed')) {
                                maxs.push("maxed");
                            } else {
                                maxs.push("unmaxed");
                            }
                            cont++
                        });

                        let obj = {id: player_container.querySelector('span.player_id_span').textContent, maxs: maxs, date: new Date()}
                        player_maxs_map.set(player_container.querySelector('span.player_id_span').textContent, obj)
                        GM_setValue("players_maxs_" + window.sport, JSON.stringify([...player_maxs_map]));
                        resolve(obj)
                    })
                    .catch(error => {
                        reject(new Error("Error loading: " + link + " | " + error));
                    });

            }
        );
    }
    async function getTrainingHistory(player_id) {
        let unmaxMap = new Map(
            Array.from({ length: 16 }, (_, i) => [i, `unmax`])
        );
        var link = "https://www.managerzone.com/ajax.php?p=trainingGraph&sub=getJsonTrainingHistory&sport=" + window.sport + "&player_id=" + player_id
        let skills = new Map()
        const response = await fetch(link, {
            method: "GET",
            credentials: "include"
        });
        let texto = await response.text();

        if (texto === undefined) {
            return undefined;
        }
        let match = texto.match(/var\s+series\s*=\s*(\[[\s\S]*?\]);(?:\s*var|\s*$)/);
        let series = JSON.parse(match[1]);
        series.forEach((serie, index0) => {
            if (serie["showInNavigator"] === "true") {
                const dataArray = serie["data"];
                for (let i = 0; i < dataArray.length; i++) {
                    const data = dataArray[i];
                    if((data["name"]!==undefined)&&(data["y"]>=0)){
                        if(data["name"]!==skillIndex.get(data["y"])){
                            unmaxMap.set(data["y"]-1,"maxed")
                        }
                    }
                }
            }
        });
        return unmaxMap;
    }
    function trainingSkillsIndex() {
        return new Promise((resolve, reject) => {
            var link = "https://www.managerzone.com/ajax.php?p=trainingGraph&sub=getJsonTrainingSkills&sport=" + window.sport
            fetch(link, {
                method: "GET",
                credentials: 'include'
            })
                .then(response => response.text())
                .then(texto => {
                    let jsonStr = texto.trim().slice(1, -1);
                    let data = JSON.parse(jsonStr);
                    let skillIndex = new Map();
                    Object.entries(data).forEach(([key, skill]) => {
                        skillIndex.set(skill.graphIndex, skill.name)
                    });
                    resolve(skillIndex)
                })
                .catch(error => reject(error));
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
        /* if(!document.getElementById("deviceFormatstxc_mobile_sk")){
             let script = document.createElement('script');
             script.textContent = `
     let newElemenDevicestxc_mobile_sk = document.createElement("input");
     newElemenDevicestxc_mobile_sk.id= "deviceFormatstxc_mobile_sk";
     newElemenDevicestxc_mobile_sk.type = "hidden";
     newElemenDevicestxc_mobile_sk.value=window.device;
     if(!document.getElementById("deviceFormatstxc_mobile_sk"){
     document.body.appendChild(newElemenDevicestxc_mobile_sk);
     }

 `;
             document.documentElement.appendChild(script);
             script.remove();
             window.stxc_device_mobile=document.getElementById("deviceFormatstxc_mobile_sk").value
         }
 */

        window.stxc_device_mobile=getCurrentDevice()


alert(window.stxc_device_mobile)
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
    function getCookieMZ(name) {
        const match = document.cookie.match(
            new RegExp('(^|;\\s*)' + name + '=([^;]*)')
        );
        return match ? decodeURIComponent(match[2]) : null;
    }
    function getCurrentDevice() {
        const forceDesktop = getCookieMZ("force-desktop");
        const forceMobile = getCookieMZ("force-mobile");

        if (forceDesktop) {
            return "mobile";
        }
        if (forceMobile) {
            return "computer";
        }
        return "computer";
    }
    function createModalMenu() {
        if (GM_getValue("hpVis") === undefined) {
            GM_setValue("hpVis",true)
        }


        const snackbar = document.createElement('div');
        snackbar.id = 'snackbar_stx';
        snackbar.style.cssText = 'position:fixed;bottom:60px;right:12px;z-index:99999;';
        document.body.appendChild(snackbar);

        const style = document.createElement('style');
        style.textContent = `

#snackbar_stx {
  visibility: hidden;
  position: fixed;
  align-items: center;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 350px;
  background-color: #323232;
  color: #ffffffb3;
  text-align: center;
  border-radius: 2px;
  padding: 16px;
  z-index: 1;
  bottom: 30px;
  font-size: 17px;
  border-radius: 5px;
  box-shadow: 0 3px 5px -1px #0003, 0 6px 10px #00000024, 0 1px 18px #0000001f;
}

#snackbar_stx.showSnackBar_stx {
  visibility: visible;
  -webkit-animation: fadein 0.5s, fadeout 0.5s 8s forwards;
  animation: fadein 0.5s, fadeout 0.5s 8s forwards;
}

@-webkit-keyframes fadein {
  from {bottom: 0; opacity: 0;}
  to {bottom: 30px; opacity: 1;}
}

@keyframes fadein {
  from {bottom: 0; opacity: 0;}
  to {bottom: 30px; opacity: 1;}
}

@-webkit-keyframes fadeout {
  from {bottom: 30px; opacity: 1;}
  to {bottom: 0; opacity: 0;}
}

@keyframes fadeout {
  from {bottom: 30px; opacity: 1;}
  to {bottom: 0; opacity: 0;}
}


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
        html += `<div class="stxc-header"><span>Script Config (${GM_info.script.version})</span><button class="stxc-close" id="stxcClose">✕</button></div>`;

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

        let checked=""
        if(GM_getValue("hpVis")){checked="checked"}


        html += `
<div class="stxc-section">
    <div class="stxc-section-title">HP/LP Config</div>
    <div class="stxc-section-inner">


<div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">
<input type="checkbox" style="width: 18px; height: 18px; accent-color: #F5C800; cursor: pointer;" id="hpVis" ${checked}>
<label style="font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 0.5px;">Show HP/LP text</label>
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

        document.getElementById('hpVis').addEventListener('click', function() {
            GM_setValue('hpVis', document.getElementById('hpVis').checked ? 'checked' : '');
        });

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
    function tryInstallHook() {
        if (window.__mlHookInstalled) return true;
        if (typeof MyGame === 'undefined' || !MyGame.prototype.Load010SetupMainSceneInstance) return false;

        const original = MyGame.prototype.Load010SetupMainSceneInstance;
        MyGame.prototype.Load010SetupMainSceneInstance = function () {
            if (captureMatchLoader) {
                window.matchLoader = arguments[0];
                captureMatchLoader = false;
            }
            return original.apply(this, arguments);
        };
        window.__mlHookInstalled = true;
        return true;
    }
    function startCapture(cb) {
        clearInterval(mlTimer);
        window.matchLoader = undefined;
        captureMatchLoader = true;

        mlTimer = setInterval(() => {
            tryInstallHook();                       // reintenta hasta que MyGame exista
            if (window.matchLoader) {               // ya capturado
                clearInterval(mlTimer);
                captureMatchLoader = false;
                console.log("matchLoader capturado", window.matchLoader);
                if (cb) cb(window.matchLoader);
            }
        }, 200);
    }
    function notifySnackBar(status, msg) {

        let x = document.getElementById("snackbar_stx");
        let txt = "<img alt='' src='https://statsxente.com/MZ1/View/Images/main_icon.png' width='25px' height='25px'> <span style='color:#f44336; font-size: 17px;'>[Stats Xente Script] </span>"
        txt += msg + "</br>"
        x.innerHTML = txt;
        x.className = "showSnackBar_stx";
        setTimeout(function () { x.className = x.className.replace("showSnackBar_stx", ""); }, 4000);
        let clase = "loader-" + window.sport
        let elementos = document.querySelectorAll('.' + clase);
        elementos.forEach(elemento => elemento.remove());
    }
    async function getMaxAsync() {
        const res = await fetch("/?p=training&sport=soccer", {
            credentials: "same-origin"
        });
        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.text();
        const result = data.match(/trainingField.players\s*=\s*({.+})/);
        if (!result) throw new Error("playerMax no encontrado");

        let pmax = JSON.parse(result[1]);
        console.log(pmax)
        return pmax;
    }
    async function copyXML(mid, localAway) {
        const pmax = await getMaxAsync()
        let tmpXML = Stats2XML(mid, localAway,pmax);
        GM_setClipboard(tmpXML);
        notifySnackBar("Correct", "Tactic copied to clipboard!");
    }
    function StatsToPos_X (i, IsLocal) {
        let ret = IsLocal ? Math.round(-.255800462 * i + 199.8228530689) : Math.round(.2555000556 * i + 8.3741302936);
        return ret;
    }
    function StatsToPos_Y(i, IsLocal) {
        let ret = IsLocal ? Math.round(-.3073207154 * i + 315.9278777381) : Math.round(.3070644902 * i + 9.2794889414);
        return ret;
    }
    function Stats2XML(mid, localAway, players) {
        let data = $.parseXML(window.matchLoader.matchXml.xmlText)
        if (!data) {
            return "";
        }
        let teams = data.documentElement.getElementsByTagName("Team");
        let team = localAway ? teams[0] : teams[1];

        let pidArr = new Array();
        if (players) {
            for (let pid in players) {
                pidArr.push(pid);
            }
        }
        while (pidArr.length < 11) {
            pidArr.push(0);
        }

        let tmpXML = "<?xml version=\"1.0\" ?>" + "\r\n<SoccerTactics>\r\n\t<Team tactics=" + "\"" + team.getAttribute("tactic") + "\" playstyle=\"" + team.getAttribute("playstyle") + "\" aggression=\"" + team.getAttribute("aggression") + "\" />\r\n"
            + "\t<Pos pos=\"goalie\" pid=\"" + pidArr.shift() + "\" x=\"103\" y=\"315\" x1=\"103\" y1=\"315\" x2=\"103\" y2=\"315\" pt=\"15\" fk=\"15\" />\r\n";

        let players_xml = data.documentElement.getElementsByTagName('Player');
        for (var i = 0; i < players_xml.length; i++) {
            let pl = players_xml[i];
            let origin = pl.getAttribute('origin');
            let teamId = pl.getAttribute("teamId");
            if (origin != "" && origin != "375,0" && origin != "375,1000") {
                let arr = origin.split(",");
                if (team.getAttribute("id") == teamId) {
                    let x = StatsToPos_X(arr[0], localAway);
                    let y = StatsToPos_Y(arr[1], localAway);
                    tmpXML += "\t<Pos pos=\"normal\" pid=\"" + pidArr.shift() + "\" x=\"" + x + "\" y=\"" + y + "\" x1=\"" + x + "\" y1=\"" + y + "\" x2=\"" + x + "\" y2=\"" + y + "\" pt=\"1\" fk=\"1\" />\r\n";
                }

            }
        }
        tmpXML += "</SoccerTactics>\r\n";
        console.log(tmpXML)
        return tmpXML;
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
