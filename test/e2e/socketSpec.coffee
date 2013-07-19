describe 'sails app', ->

  it 'welcomes', ->
    # Create a widget so the update/destroy always works with ID 1
    browser().navigateTo '/widget/create'
    sleep 2

    browser().navigateTo '/'
    sleep 2

    result = element('#result')

    element('#connect').click()
    sleep 2
    expect(result.text()).toBe 'connected'

    element('#widgetList').click()
    sleep 2
    expect(result.text()).toBe 'listed'

    element('#widgetCreate').click()
    sleep 2
    expect(result.text()).toBe 'created'

    element('#widgetUpdate').click()
    sleep 2
    expect(result.text()).toBe 'updated'

    element('#widgetDestroy').click()
    sleep 2
    expect(result.text()).toBe 'destroyed'
