# building annotation with three.js and tween.js

### Progress:

VR Stereo scene when VR mode is entered<br />

![image](https://user-images.githubusercontent.com/11494733/202894761-0fba9553-ace0-459d-bfba-23462f34c5f2.png)

Ray in direction where controller is pointing with target at the point of intersection with floor added;

![image](https://user-images.githubusercontent.com/11494733/203047178-d165b6cd-35b9-4ed5-8c80-9e5386237008.png)


### Update
```diff
- original 42MB scanned model with 24MB texture <br>
      |
      |  
      |
     \|/ 
- 11MB compressed GLB model
```

this will be added to the pipeline when there will be functionality to upload your own model
```diff
+ Bravo !! 
```

## Video demo:

[![Watch the video](https://img.youtube.com/vi/44MaoyOK18k/default.jpg)](https://www.youtube.com/watch?v=44MaoyOK18k&ab_channel=PravinPoudel)


## Things to avoid or take care:

### Origin of the Mesh:

Origin of the mesh is the one thing that should be taken care of.

Check in blender where is your model origin, for example the orgin of model in drawing_room folder is;

![image](https://user-images.githubusercontent.com/11494733/201652148-4eb4364a-eba5-4a4f-9a99-5104973b4832.png)

but we need floor physics model because we don't want anything to penetrate floor and we always assume floor should be at origin.

Since this floor is not at origin, adding plane at orgin will look like this:

![image](https://user-images.githubusercontent.com/11494733/201652912-418ce406-4e9c-44d6-9e26-ecd4286ad16e.png)


