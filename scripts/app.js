$(() => {
    const app = Sammy('#main', function () {
        this.use('Handlebars', 'hbs');
        this.get('index.html', displayHome);
        this.get('#/home', displayHome);
        this.get('#/about', function (ctx) {

            ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
            ctx.username = sessionStorage.getItem('username');
            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/about/about.hbs')
            })
        });
        this.get('#/login', function (ctx) {
            ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
            ctx.username = sessionStorage.getItem('username');
            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                loginForm: './templates/login/loginForm.hbs'
            }).then(function () {
                this.partial('templates/login/loginPage.hbs')
            })


        });
        this.post('#/login', function (ctx) {
            let username = ctx.params.username;
            let password = ctx.params.password;
            auth.login(username, password).then(function (userInfo) {
                auth.saveSession(userInfo);
                auth.showInfo('Logged in :)');
                displayHome(ctx);
            }).catch(auth.handleError);
        });
        this.get('#/logout', function (ctx) {
            auth.logout()
                .then(function () {
                    sessionStorage.clear();
                    auth.showInfo('Loggen out ');
                    displayHome(ctx)
                }).catch(auth.handleError)
        });
        this.get('#/register', function (ctx) {
            ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
            ctx.username = sessionStorage.getItem('username');
            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                registerForm: './templates/register/registerForm.hbs'
            }).then(function () {
                this.partial('./templates/register/registerPage.hbs')
            })
        });
        this.post('#/register', function (ctx) {

            let username = ctx.params.username;
            let password = ctx.params.password;
            let repeatPassword = ctx.params.repeatPassword;

            if (password !== repeatPassword) {
                auth.showError('passwords doesn`t match')
            }
            else {
                auth.register(username, password).then(function (userInfo) {
                    auth.saveSession(userInfo);
                    auth.showInfo('Registered');
                    displayHome(ctx);

                }).catch(auth.handleError)
            }
        });
        this.get('#/catalog', displayCatalog);
        this.get('#/create', function (ctx) {

            ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
            ctx.username = sessionStorage.getItem('username');
            this.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                createForm: './templates/create/createForm.hbs'
            }).then(function () {
                this.partial('./templates/create/createPage.hbs')
            })
        });
        this.post('#/create', function (ctx) {
            let teamName = ctx.params.name;
            let teamComment = ctx.params.comment;
            teamsService.createTeam(teamName, teamComment)
                .then(function (teamInfo) {
                    teamsService.joinTeam(teamInfo._id)
                        .then((userInfo) => {
                            auth.saveSession(userInfo);
                            auth.showInfo(`Team ${teamName} has been created`);
                            displayCatalog(ctx);
                        }).catch(auth.handleError)
                }).catch(auth.handleError);

        });
        this.get('#/catalog/:teamId', function (ctx) {
            let teamId = ctx.params.teamId.substr(1);

            teamsService.loadTeamDetails(teamId)
                .then(function (teamInfo) {
                    ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
                    ctx.username = sessionStorage.getItem('username');

                    ctx.teamId = teamId;
                    ctx.isAuthor = teamInfo._acl.creator === sessionStorage.getItem('userId');
                    ctx.name = teamInfo.name;
                    ctx.comment = teamInfo.comment;
                    ctx.username = teamInfo.username;
                    ctx.isOnTeam = teamInfo._id === sessionStorage.getItem('teamId');
                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        teamMember:'./templates/catalog/teamMember.hbs',
                        teamControls: './templates/catalog/teamControls.hbs'
                    }).then(function () {
                        this.partial('./templates/catalog/details.hbs')
                    })
                }).catch(auth.handleError);

        });
        this.get('#/join/:teamId', function (ctx) {
            let teamId = ctx.params.teamId.substr(1);

            teamsService.joinTeam(teamId).then(function (userInfo) {
                auth.saveSession(userInfo);
                auth.showInfo('Joined Team');
                displayCatalog(ctx);
            }).catch(auth.handleError);

        });
        this.get('#/leave', function (ctx) {
            teamsService.leaveTeam().then(function (userInfo) {
                auth.saveSession(userInfo);
                auth.showInfo('Left the Team');
                displayCatalog(ctx);
            }).catch(auth.handleError);

        });
        this.get('#/edit/:teamId', function (ctx) {

            let teamId = ctx.params.teamId.substr(1);

            teamsService.loadTeamDetails(teamId)
                .then(function (teamInfo) {
                    ctx.teamId = teamId;
                    ctx.name = teamInfo.name;
                    ctx.comment = teamInfo.comment;
                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        editForm: './templates/edit/editForm.hbs'
                    }).then(function () {
                        this.partial('./templates/edit/editPage.hbs')
                    })
                }).catch(auth.handleError);

        });
        this.post('#/edit/:teamId', function (ctx) {

            let teamId = ctx.params.teamId.substr(1);
            let teamName = ctx.params.name;
            let teamComment = ctx.params.comment;
            teamsService.edit(teamId, teamName, teamComment)
                .then(function () {
                    auth.showInfo(`Team ${teamName} edited`);
                    displayCatalog(ctx);
                }).catch(auth.handleError);

        });


        function displayCatalog(ctx) {

            ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
            ctx.username = sessionStorage.getItem('username');
            teamsService.loadTeams().then(function (teams) {
                ctx.hasNoTeam = sessionStorage.getItem('teamId') === null || sessionStorage.getItem('teamId') === "undefined";
                ctx.teams = teams;
                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    team: './templates/catalog/team.hbs'
                }).then(function () {
                    this.partial('./templates/catalog/teamCatalog.hbs')
                })
            });

        }

        function displayHome(ctx) {

            ctx.loggedIn = sessionStorage.getItem('authtoken') !== null;
            ctx.username = sessionStorage.getItem('username');

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs'
            }).then(function () {
                this.partial('./templates/home/home.hbs')
            })

        }


    });

    app.run();
});