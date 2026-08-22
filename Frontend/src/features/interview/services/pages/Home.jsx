import React from 'react'

const Home = () => {
  return (
    <main className='home'>
        <div className="left">
            <textarea name="jobDescription" id="jobDescription" placeholder='Enter job description here..'></textarea>
        </div>
        <div className="right">
            <div className="input-group">
                <label htmlFor="resume"></label>
                <input type="file" name="resume" />
            </div>
        </div>
    </main>
  )
}

export default Home
