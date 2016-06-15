/*************************************/
// This method allows for the binding of Animation events to jQuery selections 
// In order to set new data, $(this).html(newData.toString()); is used, but the timing of when
// 		this happens can be manipulated as necessary.
// I find you need to have a delay after the initial fadeOut before you set a new value otherwise it
// 		tends to chain the events too quickly and look awkward.
// I tried to keep this as tidy as possible. Hopefully it makes sense. 
// As these are all selectors, if you want to define a common function you can use a class to identify it
//		as in the case of ".fade_onChange" and ".fade_onLoad" below. Any element tagged with this
//		will be bound to that animation event. Do note, however, that because I have written those for
//		streamData utilizing elements, they require data to work. You'd have to write a separate function
//		for non-data elements.
// Additionally, only the most recently applied of any animation-type will be kept. The writer erases all
//		prior animation binding using only the last known information. 


function bindAnimations() {
	
	// Default Handling for all StreamData tags. Just load the data directly, no effects.
	var targets = 	$("*[streamData]");
	
	streamBind.anim(targets, 'onLoad', function(event, newData) {
		$(this).setVal(newData);
	});
	streamBind.anim(targets, 'onChange', function(event, newData) {
		$(this).setVal(newData);
	});


	// Basic fade animation for all elements. 1.5 seconds default, 2 seconds for change.
	var targets = 	$(".fade").add(
					$(".fade_onLoad[streamData]"));

	streamBind.anim(targets, 'onLoad', function(event, newData) {
		$(this).setVal(newData);
		TweenMax.from(this, 1.5, { ease: Sine.easeOut, opacity: 0 });
	});

	var targets = 	$(".fade").add(
					$(".fade_onChange[streamData]"));

	streamBind.anim(targets, 'onChange', function(event, newData) {
		var target = $(this);
		var tl = new TimelineLite();

		tl	.to(this, 1.0, { ease: Sine.easeOut, opacity: 0 } )
			.add( function() { $(target).setVal(newData); } )
			.to(this, 1.0, { ease: Sine.easeIn, opacity: 1 }, "+=0.25" )
	});
}