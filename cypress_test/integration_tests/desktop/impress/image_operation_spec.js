/* global describe it require cy beforeEach */

var helper = require('../../common/helper');
var { insertImage, insertVideo, deleteImage, assertImageSize } = require('../../common/desktop_helper');
var desktopHelper = require('../../common/desktop_helper');
var { triggerNewSVGForShapeInTheCenter } = require('../../common/impress_helper');

describe(['tagdesktop'], 'Image Operation Tests', function() {

	beforeEach(function() {
		helper.setupAndLoadDocument('impress/image_operation.odp');
	});

	it('Insert/Delete image',function() {
		desktopHelper.switchUIToNotebookbar();
		insertImage();

		//make sure that image is in focus
		cy.cGet('#document-container svg g')
			.should('exist');

		deleteImage();
	});

	it("Insert multimedia", function () {
		desktopHelper.switchUIToNotebookbar();
		insertVideo();
	});

	it('Resize image when keep ratio option enabled and disabled', function() {
		desktopHelper.switchUIToNotebookbar();
		insertImage();
		//when Keep ratio is unchecked
		assertImageSize(438, 111);

		//sidebar needs more time
		cy.cGet('#sidebar-panel').should('be.visible').wait(2000).scrollTo('bottom');

		cy.cGet('#PosSizePropertyPanelPanelExpander-label').should('be.visible').click();

		cy.cGet('#selectwidth input').clear({force:true})
			.type('10{enter}', {force:true});

		cy.cGet('#selectheight input').clear({force:true})
			.type('4{enter}', {force:true});

		triggerNewSVGForShapeInTheCenter();

		assertImageSize(463, 185);

		//Keep ratio checked
		//sidebar needs more time
		cy.cGet('#sidebar-panel').should('be.visible').wait(2000).scrollTo('bottom');

		cy.cGet('#PosSizePropertyPanelPanelExpander-label').should('be.visible').click();

		helper.waitUntilIdle('#ratio input');

		cy.cGet('#ratio input').check();

		helper.waitUntilIdle('#selectheight');

		cy.cGet('#selectheight input').clear({force:true})
			.type('5{enter}', {force:true});

		triggerNewSVGForShapeInTheCenter();

		assertImageSize(579, 232);
	});
});
