/* -*- js-indent-level: 8 -*- */
/*
 * Copyright the Collabora Online contributors.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * JSDialog.ScrolledWindow - container with scrollbars
 *
 * Example JSON:
 * {
 *     id: 'id',
 *     type: 'scrollwindow',
 *     vertical: {
 * 	       policy: always,
 *         lower: 0,
 *         upper: 5,
 *         page_size: 4
 *     },
 *     horizontal: {
 * 	       policy: always,
 *         lower: 0,
 *         upper: 5,
 *         page_size: 4
 *     },
 *     children: [...]
 * }
 */

/* global JSDialog */

function _hasDrawingAreaInside(children) {
	if (!children)
		return false;

	for (var i in children) {
		if (children[i].type === 'drawingarea')
			return true;
		if (_hasDrawingAreaInside(children[i].children))
			return true;
	}

	return false;
}

function _scrolledWindowControl(parentContainer, data, builder) {
	var scrollwindow = L.DomUtil.create('div', builder.options.cssClass + ' ui-scrollwindow', parentContainer);
	if (data.id)
		scrollwindow.id = data.id;

	// drawing areas inside scrollwindows should be not cropped so we add special class
	if (_hasDrawingAreaInside(data.children))
		L.DomUtil.addClass(scrollwindow, 'has-ui-drawing-area');

	var content = L.DomUtil.create('div', builder.options.cssClass + ' ui-scrollwindow-content', scrollwindow);

	builder.build(content, data.children, false);

	if (!data.vertical && !data.horizontal)
		return false;

	var noVertical = data.vertical.policy === 'never';
	if (noVertical)
		scrollwindow.style.overflowY = 'hidden';
	if (data.vertical.policy === 'always')
		scrollwindow.style.overflowY = 'scroll';

	var noHorizontal = data.horizontal.policy === 'never';
	if (noHorizontal)
		scrollwindow.style.overflowX = 'hidden';
	if (data.horizontal.policy === 'always')
		scrollwindow.style.overflowX = 'scroll';

	var realContentHeight = scrollwindow.scrollHeight;
	var realContentWidth = scrollwindow.scrollwidth;

	var margin = 15;

	var verticalSteps = (data.vertical.upper - data.vertical.lower - data.vertical.page_size) * 10;
	if (verticalSteps < 0 || noVertical)
		verticalSteps = 0;

	var horizontalSteps = (data.horizontal.upper - data.horizontal.lower - data.horizontal.page_size) * 10;
	if (horizontalSteps < 0 || noHorizontal)
		horizontalSteps = 0;

	var timeoutLimit = 2;
	var updateSize = function () {
		realContentHeight = scrollwindow.scrollHeight;
		realContentWidth = scrollwindow.scrollwidth;
		if (realContentHeight === 0 || realContentWidth === 0) {
			if (timeoutLimit--)
				setTimeout(updateSize, 100);
			return;
		}

		if (!noVertical) {
			content.style.height = (realContentHeight + verticalSteps) + 'px';
			scrollwindow.style.height = (realContentHeight + margin) + 'px';
		}
		if (!noHorizontal) {
			content.style.width = (realContentWidth + horizontalSteps) + 'px';
			scrollwindow.style.width = (realContentWidth + margin) + 'px';
		}

		content.scrollTop = data.vertical.value * 10;
		content.scrollLeft = data.horizontal.value * 10;

		content.style.margin = content.scrollTop + 'px ' + margin + 'px ' + margin + 'px ' + content.scrollLeft + 'px';
	};

	if (data.user_managed_scrolling !== false) {}
		setTimeout(updateSize, 0);
	}

	const resizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			let target = "content";
			if (entry.target == scrollwindow) {
				target = "scrollWindow";
			}
			console.log("observer", target, entry.contentRect)
		}
	});

	resizeObserver.observe(scrollwindow);
	resizeObserver.observe(content);

	// detect destruction of child node of content

	// Options de l'observateur (quelles sont les mutations à observer)
	var config = { attributes: true, childList: true };

	var mutating = false;
	var childs = 0;
	// Fonction callback à éxécuter quand une mutation est observée
	var callback = function (mutationsList) {
	for (var mutation of mutationsList) {
		if (mutation.type == "childList") {
			if (mutation.removedNodes.length > 0) {
				console.log("mutation: child removed", mutation.removedNodes);
				mutating = true;
			}
			if (mutation.addedNodes.length > 0) {
				console.log("mutation: child added", mutation.addedNodes);
				mutating = false;
			}
			let prevChild = childs;
			childs = mutation.target.childNodes.length;
			if (childs > prevChild) {
				window.scrollTop = lastScrollV;
			}
			console.log("childs", childs);

		} else if (mutation.type == "attributes") {
			console.log("mutation attribute: '" + mutation.attributeName + "' changed.");
		}
	}
	};

	// Créé une instance de l'observateur lié à la fonction de callback
	var observer = new MutationObserver(callback);
	observer.observe(content, config);

	var lastScrollV = null;
	var lastScrollH = null;
	
	var sendTimer = null;

	if ((!noVertical && verticalSteps) || (!noHorizontal && horizontalSteps)) {
		scrollwindow.addEventListener('scroll', function () {

			if (childs == 0) {
				console.log("ignoring scroll event", event);
				// ignore scroll event while dom is being edited
				//window.scrollTop = lastScrollV;
				mutating = false;
				return;
			}
			
			// keep content at the same place on the screen
			var scrollTop = scrollwindow.scrollTop;
			var scrollLeft = scrollwindow.scrollLeft;

			if (data.user_managed_scrolling !== false) {
				content.style.margin = scrollTop + 'px ' + margin + 'px ' + margin + 'px ' + scrollLeft + 'px';
				content.style.height = (realContentHeight - scrollTop + verticalSteps) + 'px';
				content.style.width = (realContentWidth - scrollLeft + horizontalSteps) + 'px';
			}

			console.log("scroll event", event);
			if (sendTimer)
				clearTimeout(sendTimer);
			sendTimer = setTimeout(function () {
				builder.callback('scrolledwindow', 'scrollv', scrollwindow, Math.round(scrollTop / 10), builder);
				builder.callback('scrolledwindow', 'scrollh', scrollwindow, Math.round(scrollLeft / 10), builder); }, 50);
		});
	}

	return false;
}

JSDialog.scrolledWindow = function (parentContainer, data, builder) {
	var buildInnerData = _scrolledWindowControl(parentContainer, data, builder);
	return buildInnerData;
};
