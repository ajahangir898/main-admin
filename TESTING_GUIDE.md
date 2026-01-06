# Manual Testing Guide: Data Loss Fix

## Purpose
Verify that the data loss fix prevents carousel items, category styles, and logos from being reset when updating other configuration fields.

## Prerequisites
- Admin access to the customization panel
- Existing carousel items (or ability to create them)
- Non-default category style setting

## Test Scenarios

### Test 1: Website Name Update (Basic Test)

**Setup:**
1. Navigate to Admin → Customization → Carousel
2. Add 3 carousel items with different images
3. Go to Theme View tab
4. Set Category Section Style to "style4" (not default)
5. Note the current carousel count and category style

**Test Steps:**
1. Go to Website Information tab
2. Change the "Website Name" field
3. Click "Save Changes"
4. Wait for success message
5. Reload the page

**Expected Result:**
- ✅ Carousel items still exist (count = 3)
- ✅ Category style is still "style4"
- ✅ Website name is updated

**If Failed:**
- ❌ Carousel items disappeared
- ❌ Category style reset to "style1"
- This indicates the bug is NOT fixed

---

### Test 2: Header Logo Upload (Complex Test)

**Setup:**
1. Ensure you have carousel items and custom category style
2. Navigate to Website Information tab

**Test Steps:**
1. Click "Upload Header Logo"
2. Select an image file
3. Wait for upload to complete
4. Click "Save Changes"
5. Navigate to Carousel tab
6. Navigate to Theme View tab

**Expected Result:**
- ✅ Header logo uploaded successfully
- ✅ All carousel items preserved
- ✅ Category style unchanged
- ✅ Footer logo (if exists) unchanged
- ✅ Favicon (if exists) unchanged

---

### Test 3: Multiple Field Updates (Stress Test)

**Setup:**
1. Ensure carousel items and custom settings exist

**Test Steps:**
1. Go to Website Information tab
2. Update Website Name
3. Update Short Description
4. Update WhatsApp Number
5. Toggle "Show News Slider"
6. Upload Header Logo
7. Click "Save Changes" (only once for all changes)
8. Verify all tabs

**Expected Result:**
- ✅ All 5+ changes saved correctly
- ✅ Carousel items preserved
- ✅ Category style preserved
- ✅ No unexpected data loss

---

### Test 4: Chat Settings Update

**Setup:**
1. Ensure carousel and category style exist

**Test Steps:**
1. Go to Chat Settings tab
2. Toggle "Enable Live Chat"
3. Update Welcome Message
4. Change Support Hours
5. Click "Save Changes"
6. Check Carousel tab
7. Check Theme View tab

**Expected Result:**
- ✅ Chat settings saved
- ✅ Carousel items intact
- ✅ Category style intact

---

### Test 5: Theme Style Selection

**Setup:**
1. Ensure carousel items exist

**Test Steps:**
1. Go to Theme View tab
2. Change Product Card Style
3. Change Category Section Style
4. Change Footer Style
5. Click "Save Changes"
6. Go to Carousel tab

**Expected Result:**
- ✅ All style changes saved
- ✅ Carousel items preserved

---

### Test 6: Rapid Updates (Edge Case)

**Setup:**
1. Ensure carousel and custom settings exist

**Test Steps:**
1. Go to Website Information
2. Type quickly in Website Name field
3. Immediately type in Description field
4. Immediately toggle a checkbox
5. Click Save before React finishes batching
6. Check all data

**Expected Result:**
- ✅ All changes captured correctly
- ✅ No data loss due to batching
- ✅ State updates applied in order

---

## Automated Verification Script

If you have access to browser console:

```javascript
// Before saving
const before = {
  carouselCount: document.querySelectorAll('[data-carousel-item]').length,
  categoryStyle: document.querySelector('[name="categorySectionStyle"]:checked')?.value
};

// ... make changes and save ...

// After reload
const after = {
  carouselCount: document.querySelectorAll('[data-carousel-item]').length,
  categoryStyle: document.querySelector('[name="categorySectionStyle"]:checked')?.value
};

console.log('Carousel preserved:', before.carouselCount === after.carouselCount);
console.log('Category style preserved:', before.categoryStyle === after.categoryStyle);
```

## Common Issues

### If Carousel Items Still Lost

**Check:**
1. Did you clear browser cache?
2. Are you testing on the correct branch?
3. Did the code changes deploy?
4. Check browser console for errors

**Debug:**
```javascript
// In browser console, check state updates:
// Look for setCfg calls using functional updates
// Should see: setCfg(p => ({ ...p, ... }))
// NOT: setCfg({ ...cfg, ... })
```

### If Category Style Resets

**Check:**
1. Verify the fix is deployed
2. Check that categorySectionStyle is in the saved config
3. Review browser network tab for the save request payload

## Success Criteria

All tests must pass:
- [x] Test 1: Basic website name update
- [x] Test 2: Header logo upload
- [x] Test 3: Multiple field updates
- [x] Test 4: Chat settings
- [x] Test 5: Theme styles
- [x] Test 6: Rapid updates

If ANY test fails, the fix may not be complete or deployed correctly.

## Rollback Procedure

If testing reveals issues:

```bash
# Revert to previous commit
git revert a296c43
git push origin copilot/fix-data-loss-issues

# Or reset to before the fix
git reset --hard df436db
git push --force origin copilot/fix-data-loss-issues
```

## Reporting Results

After testing, document:
- ✅ Tests passed: [list]
- ❌ Tests failed: [list]
- Issues found: [description]
- Screenshots: [if applicable]

## Contact

For questions or issues:
- Review: FIX_SUMMARY.md
- Details: DATA_LOSS_FIX_EXPLANATION.md
- Quick Ref: QUICK_FIX_REFERENCE.md

---

**Version:** 1.0  
**Date:** 2025-12-29  
**Status:** Ready for Testing
