
<div style="margin-bottom: 1%">
	<img width="70px" src="https://raw.githubusercontent.com/foundation29org/Dx29_client/develop/src/assets/img/logo-Dx29.png?token=AO6XHRMW66XDX23H2HNOONS7KDAD6">			
</div>

Dx29 client
===============================================================================================================================

[![Build Status](https://f29.visualstudio.com/Health29%20for%20Diagnosis/_apis/build/status/Dx29%20-%20DEV%20-%20Client%20-%20CI?branchName=develop)](https://f29.visualstudio.com/Health29%20for%20Diagnosis/_build/latest?definitionId=33&branchName=develop)

#### 1. Overview 

Dx29 is a platform built to assist medical professionals during the diagnosis process to make it quicker and more accurate when dealing with rare diseases.

No tool can replace the knowledge of a clinician or physician, so we have designed Dx29 to help those professionals tap into the global community of medical knowledge to facilitate decision-making and diagnoses that might otherwise remain a mystery. Based on the symptoms drawn from a patient’s medical history, and suggesting new symptoms to look for. Dx29 offers medical teams possible pathologies from a wide range of rare diseases that many doctors may not have first-hand experience with.

Dx29 extends this idea further by offering medical teams feedback from their patients as new symptoms arise and leveraging available genetic information to surface additional pathologies that may not appear through standards tests. By combining the fundamental basics of good health care with cutting-edge medical technology, Dx29 gives medical professionals the chance to offer their patients a level of care that might not otherwise be possible.

You can consult the documentation on the [architecture of the dx29 project](https://dx29.readthedocs.io/en/latest/).

This project contains the core of the dx29 platform, the webapp from where the frontend will be developed and the communications with different services to provide functionalities. In particular in this repository is the client code of the project.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.1.

The project uses [gitflow workflow](https://nvie.com/posts/a-successful-git-branching-model/). 
According to this it has implemented a branch-based system to work with three different environments. Thus, there are two permanent branches in the project:
>- The develop branch to work on the development environment.
>- The master branch to work on the production environment

And for the test environment, release branches will be created.

<p>&nbsp;</p>

#### 2. Configuration: Pre-requisites

This project uses external services.

For each of the environments it will be necessary to configure the value of the secret keys to connect with the different APIs.
So, to be able to compile and execute this project you have to modify the extension of the src/environments/ files, removing ".sample" (for example, you have to modify environments.ts.sample by environments.ts) and here complete the information of the secret keys of the services.

As a minimum, it is mandatory to perform these actions on the environment.ts file (to work locally) in order to compile and run the platform. If you want to use any of the other environments, it is also essential that this file has been modified in addition to the one corresponding to the environment on which you want to work.

##### External services required

To execute the project it is necessary to implement or configure a list of external services according to what is explained in the [dx29 architecture document](https://dx29.readthedocs.io/en/latest/).

Thus, we will mainly need:

>- Two [Azure Blob storage](https://docs.microsoft.com/en-US/azure/storage/blobs/storage-blobs-introduction), one for settings and the other one for patient information.
>- [Exomiser service](https://github.com/foundation29org/Exomiser/edit/master/README.md) 
>- [Phenolyzer service](https://github.com/foundation29org/phenolyzer)
>- F29 apis:
>>- (svc,bio,api,ncr) -> TODO: URL to our opensource service
    

<p>&nbsp;</p>

#### 3. Download and installation

Download the repository code with `git clone` or use download button.
Run `npm install` to install the dependencies.
Angular requires a [current, active LTS, or maintenance LTS](https://nodejs.org/en/about/releases/) version of Node.js.

<p>&nbsp;</p>

#### 4. Deployment

Run `ng serve` or `ng serve -aot`. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

It is mandatory to run the [Dx29 server](https://github.com/foundation29org/Dx29_server) before. 

<p>&nbsp;</p>

#### 5. Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. 

##### Scripts

In the package.json file different scripts have been implemented to perform the build of these environments: 
>- build for localhost
>- buildDev for development
>- buildStaging for test
>- buildProd for production
In each case the corresponding environment file is used.

Run `npm run <script>` to build the project for each environment. The build artifacts will be stored in the `dist/` directory. 

<p>&nbsp;</p>

#### 6. Testing

##### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

##### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

<p>&nbsp;</p>

#### 7. Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

<p>&nbsp;</p>

#### 8. Other project links needed for deploy dx29 platform

You can consult the documentation on the [architecture of the dx29 project](https://dx29.readthedocs.io/en/latest/).

>- [Dx29 server](https://github.com/foundation29org/Dx29_server) 
>- [Exomiser service](https://github.com/foundation29org/Exomiser/edit/master/README.md) 
>- [Phenolyzer service](https://github.com/foundation29org/phenolyzer)
>- TODO: F29 API services github

<p>&nbsp;</p>
<p>&nbsp;</p>

<div style="border-top: 1px solid;
	padding-top: 1%;
    padding-right: 1%;
    padding-bottom: 0.1%;">
	<div align="right">
		<img width="150px" src="https://raw.githubusercontent.com/foundation29org/Dx29_client/develop/src/assets/img/logo-foundation-twentynine-footer.png?token=AO6XHRNMCKEPE2T65NNGY327KC5LI">
	</div>
	<div align="right" style="padding-top: 0.5%">
		<p align="right">	
			Copyright © 2020
			<a style="color:#009DA0" href="https://www.foundation29.org/" target="_blank"> Foundation29</a>
		</p>
	</div>
<div>